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

const utapi = new UTApi();

/* -------------------------------------------------------------------------
   CREATE PRODUCT (Seller Only) — Supports Variants + Images + Store Model
--------------------------------------------------------------------------- */
export const createProductAction = async (values: productSchemaType) => {
  const user = await CurrentUser();
  if (!user || user.role !== "SELLER") return { error: "Unauthorized access" };

  const parsed = productSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid product data" };

  const {
    name,
    brand,
    description,
    categoryId,
    oldPriceUSD,
    discount,
    images,
    variants = [],
  } = parsed.data;

  const store = await prisma.store.findUnique({
    where: { userId: user.id },
  });

  if (!store) return { error: "Create a store first" };

  if (!variants.length) {
    return { error: "At least one variant is required" };
  }

  const basePriceUSD = Math.min(...variants.map((v) => v.priceUSD));

  const specsArray =
    values.specifications
      ?.split("\n")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  await prisma.product.create({
    data: {
      name,
      description,
      specifications: specsArray,
      technicalDetails: values.technicalDetails ?? [],
      categoryId,
      storeId: store.id,
      brand,

      basePriceUSD,
      oldPriceUSD,
      discount,

      images: {
        createMany: {
          data: images.map((i) => ({
            imageUrl: i.url,
            imageKey: i.key,
          })),
        },
      },

      variants: {
        createMany: {
          data: variants.map((v) => ({
            sku: v.sku,
            priceUSD: v.priceUSD,
            stock: v.stock,
            color: v.color,
            size: v.size,
            oldPriceUSD: v.oldPriceUSD,
            discount: v.discount,
          })),
        },
      },
    },
  });

  revalidatePath("/marketplace/dashboard/seller/products");
  return { success: "Product created successfully!" };
};

/* -------------------------------------------------------------------------
   UPDATE PRODUCT
--------------------------------------------------------------------------- */
export const updateProductAction = async (
  productId: string,
  values: updateProductSchemaType
) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };
  if (user.role !== "SELLER")
    return { error: "Only sellers can update products" };

  const existing = await prisma.product.findFirst({
    where: { id: productId, store: { userId: user.id } },
    include: { images: true, variants: true },
  });
  if (!existing) return { error: "Product not found" };

  const parsed = updateProductSchema.safeParse(values);
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
  } = parsed.data;

  const specsArray =
    values.specifications
      ?.split("\n")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  if (!variants.length) {
    return { error: "At least one variant is required" };
  }
  const basePriceUSD = Math.min(...variants.map((v) => v.priceUSD));

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        specifications: specsArray,
        technicalDetails: values.technicalDetails ?? [],
        brand,
        categoryId,
        oldPriceUSD,
        discount,
        basePriceUSD,
      },
    });

    const deleted = existing.images.filter(
      (img) => !images.some((p) => p.url === img.imageUrl)
    );
    if (deleted.length) {
      await tx.productImage.deleteMany({
        where: { id: { in: deleted.map((d) => d.id) } },
      });
      await utapi.deleteFiles(deleted.map((d) => d.imageKey).filter(Boolean));
    }

    const newImages = images.filter(
      (p) => !existing.images.some((d) => d.imageUrl === p.url)
    );
    if (newImages.length) {
      await tx.productImage.createMany({
        data: newImages.map((img) => ({
          productId,
          imageUrl: img.url,
          imageKey: img.key,
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
              color: v.color,
              size: v.size,
              oldPriceUSD: v.oldPriceUSD,
              discount: v.discount,
            },
            create: {
              productId,
              sku: v.sku,
              priceUSD: v.priceUSD,
              stock: v.stock,
              color: v.color,
              size: v.size,
              oldPriceUSD: v.oldPriceUSD,
              discount: v.discount,
            },
          });
        })
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
      include: { images: true },
    });

    if (!product) return { error: "Product not found or unauthorized" };

    const keys = product.images.map((img) => img.imageUrl.split("/").pop()!);

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

