"use server";

import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  productSchema,
  productSchemaType,
  updateProductSchema,
  updateProductSchemaType,
} from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";
import { ensureVerifiedSeller } from "@/lib/verification/guards";
import {
  serializeFoodDetails,
  syncFoodProductRelationsInTx,
} from "@/lib/food/productWrite";
import {
  ensureProductImageFileAsset,
  productImageWithAssetInclude,
  touchOrMarkFileAssetOrphaned,
} from "@/lib/product-images";

const utapi = new UTApi();

/* -------------------------------------------------------------------------
   CREATE PRODUCT (Seller Only) — Supports Variants + Images + Store Model
--------------------------------------------------------------------------- */
export const createProductAction = async (values: productSchemaType) => {
  const user = await CurrentUser();
  if (!user || user.role !== "SELLER") return { error: "Unauthorized access" };

  await ensureVerifiedSeller(user.id);

  const store = await prisma.store.findUnique({
    where: { userId: user.id },
    select: { id: true, type: true },
  });

  if (!store) return { error: "Create a store first" };

  const isFoodStore = store.type === "FOOD";
  const buildSimpleSku = (productName: string) => {
    const cleaned = (productName || "PRD")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
    const prefix = cleaned.length > 0 ? cleaned : "PRD";
    return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const normalizedVariants =
    values.variants?.map((variant) => ({
      ...variant,
      sku: variant.sku?.trim() || buildSimpleSku(values.name),
      color: isFoodStore ? undefined : variant.color,
      size: isFoodStore ? undefined : variant.size,
    })) ?? [];

  const normalizedValues: productSchemaType = {
    ...values,
    isFoodProduct: isFoodStore,
    foodDetails: isFoodStore ? values.foodDetails : null,
    foodConfig: isFoodStore ? values.foodConfig : null,
    foodOptionGroups: isFoodStore ? values.foodOptionGroups ?? [] : [],
    variants: normalizedVariants,
  };

  const parsed = productSchema.safeParse(normalizedValues);
  if (!parsed.success) return { error: "Invalid product data" };

  const {
    name,
    brand,
    description,
    categoryId,
    oldPriceUSD,
    discount,
    images,
    variants,
    foodDetails,
    foodConfig,
    foodOptionGroups,
  } = parsed.data;

  if (!variants?.length) {
    return { error: "At least one variant is required" };
  }
  if (isFoodStore && variants.length !== 1) {
    return { error: "FOOD products must have exactly one variant" };
  }

  const basePriceUSD = Math.min(...variants.map((v) => v.priceUSD));

  const specsArray =
    values.specifications
      ?.split("\n")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const serializedFoodDetails = serializeFoodDetails(
    isFoodStore ? foodDetails : null,
  );

  await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: {
        name,
        description,
        specifications: specsArray,
        technicalDetails: values.technicalDetails ?? [],
        categoryId,
        storeId: store.id,
        brand,
        isFoodProduct: isFoodStore,
        foodDetails: serializedFoodDetails,
        basePriceUSD,
        oldPriceUSD,
        discount,
        images: {
          create: [],
        },
        variants: {
          createMany: {
            data: variants.map((v) => ({
              sku: v.sku,
              priceUSD: v.priceUSD,
              stock: v.stock,
              color: isFoodStore ? null : v.color,
              size: isFoodStore ? null : v.size,
              oldPriceUSD: v.oldPriceUSD,
              discount: v.discount,
            })),
          },
        },
      },
      select: { id: true },
    });

    if (images.length) {
      const assets = await Promise.all(
        images.map((image) =>
          ensureProductImageFileAsset(tx, {
            uploadedById: user.id,
            image,
          }),
        ),
      );

      await tx.productImage.createMany({
        data: assets.map((asset) => ({
          productId: createdProduct.id,
          fileAssetId: asset.id,
        })),
      });
    }

    if (isFoodStore) {
      await syncFoodProductRelationsInTx(tx, createdProduct.id, {
        foodConfig,
        foodOptionGroups,
      });
    }
  });

  revalidatePath("/marketplace/dashboard/seller/products");
  return { success: "Product created successfully!" };
};

/* -------------------------------------------------------------------------
   UPDATE PRODUCT
--------------------------------------------------------------------------- */
export const updateProductAction = async (
  productId: string,
  values: updateProductSchemaType,
) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };
  if (user.role !== "SELLER")
    return { error: "Only sellers can update products" };

  const existing = await prisma.product.findFirst({
    where: { id: productId, store: { userId: user.id } },
    include: {
      images: {
        include: productImageWithAssetInclude,
      },
      variants: true,
      foodProductConfig: true,
      foodOptionGroups: {
        include: {
          options: true,
        },
      },
      store: {
        select: {
          type: true,
        },
      },
    },
  });
  if (!existing) return { error: "Product not found" };

  const isFoodStore = existing.store.type === "FOOD";
  const buildSimpleSku = (productName: string) => {
    const cleaned = (productName || "PRD")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
    const prefix = cleaned.length > 0 ? cleaned : "PRD";
    return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const normalizedVariants =
    values.variants?.map((variant) => ({
      ...variant,
      sku: variant.sku?.trim() || buildSimpleSku(values.name),
      color: isFoodStore ? undefined : variant.color,
      size: isFoodStore ? undefined : variant.size,
    })) ?? [];

  const normalizedValues: updateProductSchemaType = {
    ...values,
    isFoodProduct: isFoodStore,
    foodDetails: isFoodStore ? values.foodDetails : null,
    foodConfig: isFoodStore ? values.foodConfig : null,
    foodOptionGroups: isFoodStore ? values.foodOptionGroups ?? [] : [],
    technicalDetails: isFoodStore ? [] : (values.technicalDetails ?? []),
    specifications: isFoodStore ? "" : values.specifications,
    variants: normalizedVariants,
  };

  const parsed = updateProductSchema.safeParse(normalizedValues);
  if (!parsed.success) {
    return { error: "Invalid product data" };
  }

  const {
    name,
    description,
    brand,
    categoryId,
    oldPriceUSD,
    discount,
    images,
    variants,
    foodDetails,
    foodConfig,
    foodOptionGroups,
  } = parsed.data;

  const specsArray =
    parsed.data.specifications
      ?.split("\n")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  if (!variants.length) {
    return { error: "At least one variant is required" };
  }
  if (isFoodStore && variants.length !== 1) {
    return { error: "FOOD products must have exactly one variant" };
  }
  const basePriceUSD = Math.min(...variants.map((v) => v.priceUSD));

  const serializedFoodDetails = serializeFoodDetails(
    isFoodStore ? foodDetails : null,
  );

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        specifications: specsArray,
        technicalDetails: parsed.data.technicalDetails ?? [],
        brand,
        categoryId,
        oldPriceUSD,
        discount,
        basePriceUSD,
        isFoodProduct: isFoodStore,
        foodDetails: serializedFoodDetails,
      },
    });

    await syncFoodProductRelationsInTx(tx, productId, {
      foodConfig: isFoodStore ? foodConfig : null,
      foodOptionGroups: isFoodStore ? foodOptionGroups : [],
    });

    const deleted = existing.images.filter(
      (img) => !images.some((p) => p.url === img.fileAsset.url),
    );
    if (deleted.length) {
      await tx.productImage.deleteMany({
        where: { id: { in: deleted.map((d) => d.id) } },
      });
      await Promise.all(
        deleted.map((image) => touchOrMarkFileAssetOrphaned(tx, image.fileAssetId)),
      );
    }

    const newImages = images.filter(
      (p) => !existing.images.some((d) => d.fileAsset.url === p.url),
    );
    if (newImages.length) {
      const assets = await Promise.all(
        newImages.map((image) =>
          ensureProductImageFileAsset(tx, {
            uploadedById: user.id,
            image,
          }),
        ),
      );

      await tx.productImage.createMany({
        data: assets.map((asset) => ({
          productId,
          fileAssetId: asset.id,
        })),
      });
    }

    if (variants.length > 0) {
      await Promise.all(
        variants.map((v) => {
          return tx.productVariant.upsert({
            where: { productId_sku: { productId, sku: v.sku } },
            update: {
              priceUSD: v.priceUSD,
              stock: v.stock,
              color: isFoodStore ? null : v.color,
              size: isFoodStore ? null : v.size,
              oldPriceUSD: v.oldPriceUSD,
              discount: v.discount,
            },
            create: {
              productId,
              sku: v.sku,
              priceUSD: v.priceUSD,
              stock: v.stock,
              color: isFoodStore ? null : v.color,
              size: isFoodStore ? null : v.size,
              oldPriceUSD: v.oldPriceUSD,
              discount: v.discount,
            },
          });
        }),
      );

      await tx.productVariant.deleteMany({
        where: {
          productId,
          sku: { notIn: variants.map((v) => v.sku) },
        },
      });
    }
  });

  revalidatePath("/marketplace/dashboard/seller/products");
  return { success: "Product updated successfully" };
};

/* -------------------------------------------------------------------------
   DELETE PRODUCT + VARIANTS + IMAGES
--------------------------------------------------------------------------- */
export const deleteProductAction = async (productId: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };

  try {
    if (user.role !== "SELLER")
      return { error: "Only sellers can delete products" };

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        store: { userId: user.id },
      },
      include: {
        images: {
          include: productImageWithAssetInclude,
        },
      },
    });

    if (!product) return { error: "Product not found or unauthorized" };

    const keys = product.images.map((img) => img.fileAsset.storageKey).filter(Boolean);

    try {
      await utapi.deleteFiles(keys);
    } catch (err) {
      console.warn("Image deletion failed", err);
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/marketplace/dashboard/seller/products");

    return { success: "Product deleted successfully!" };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { error: "Something went wrong while deleting product" };
  }
};
