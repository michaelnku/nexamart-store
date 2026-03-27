"use server";

import { CurrentUser } from "@/lib/currentUser";
import { createAuditLog } from "@/lib/audit/service";
import { ensureFileAsset } from "@/lib/file-assets";
import { mapCategoryMedia, categoryMediaInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";
import { touchOrMarkFileAssetOrphaned } from "@/lib/product-images";
import { CategorySchemaType, categorySchema } from "@/lib/zodValidation";
import { revalidatePath } from "next/cache";

/* -------------------------------------------------------------------------
   CREATE PRODUCT CATEGORY (admin Only) 
--------------------------------------------------------------------------- */
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const adminAddProductCategoriesAction = async (
  values: CategorySchemaType
) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };
  if (user.role !== "ADMIN")
    return { error: "Access denied. Only admins can add categories" };

  const validation = categorySchema.safeParse(values);
  if (!validation.success) return { error: "Invalid category data" };

  const { name, parentId, iconImage, bannerImage, color } = validation.data;
  const slug = slugify(name);

  try {
    const exists = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (exists) return { error: "A category with this name already exists" };

    const category = await prisma.$transaction(async (tx) => {
      const iconAsset = iconImage
        ? await ensureFileAsset(tx, {
            url: iconImage,
            category: "OTHER",
            kind: "IMAGE",
            isPublic: true,
          })
        : null;

      const bannerAsset = bannerImage
        ? await ensureFileAsset(tx, {
            url: bannerImage,
            category: "OTHER",
            kind: "IMAGE",
            isPublic: true,
          })
        : null;

      return tx.category.create({
        data: {
          name,
          slug,
          parentId: parentId || null,
          iconImageFileAssetId: iconAsset?.id ?? null,
          bannerImageFileAssetId: bannerAsset?.id ?? null,
          color,
        },
        include: categoryMediaInclude,
      });
    });

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actionType: "CATEGORY_CREATED",
      targetEntityType: "CATEGORY",
      targetEntityId: category.id,
      summary: `Created category ${category.name}.`,
      metadata: {
        slug: category.slug,
        parentId: category.parentId,
      },
    });

    revalidatePath("/marketplace/dashboard/admin/products");
    return {
      success: "Category created successfully",
      category: mapCategoryMedia(category),
    };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong while creating category" };
  }
};

export const adminUpdateCategoryAction = async (
  categoryId: string,
  values: CategorySchemaType
) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };
  if (user.role !== "ADMIN") return { error: "Access denied" };

  const validation = categorySchema.safeParse(values);
  if (!validation.success) return { error: "Invalid data" };

  const { name, parentId, iconImage, bannerImage, color } = validation.data;
  const slug = slugify(name);

  try {
    const exists = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }], NOT: { id: categoryId } },
    });

    if (exists) return { error: "A category with this name already exists" };

    const updatedCategory = await prisma.$transaction(async (tx) => {
      const existingCategory = await tx.category.findUnique({
        where: { id: categoryId },
        select: {
          iconImageFileAssetId: true,
          bannerImageFileAssetId: true,
        },
      });

      const nextIconAsset =
        iconImage === undefined
          ? undefined
          : iconImage
            ? await ensureFileAsset(tx, {
                url: iconImage,
                category: "OTHER",
                kind: "IMAGE",
                isPublic: true,
              })
            : null;

      const nextBannerAsset =
        bannerImage === undefined
          ? undefined
          : bannerImage
            ? await ensureFileAsset(tx, {
                url: bannerImage,
                category: "OTHER",
                kind: "IMAGE",
                isPublic: true,
              })
            : null;

      const category = await tx.category.update({
        where: { id: categoryId },
        data: {
          name,
          slug,
          parentId: parentId || null,
          iconImageFileAssetId:
            nextIconAsset === undefined ? undefined : nextIconAsset?.id ?? null,
          bannerImageFileAssetId:
            nextBannerAsset === undefined
              ? undefined
              : nextBannerAsset?.id ?? null,
          color,
        },
        include: categoryMediaInclude,
      });

      if (
        existingCategory?.iconImageFileAssetId &&
        existingCategory.iconImageFileAssetId !== nextIconAsset?.id
      ) {
        await touchOrMarkFileAssetOrphaned(tx, existingCategory.iconImageFileAssetId);
      }

      if (
        existingCategory?.bannerImageFileAssetId &&
        existingCategory.bannerImageFileAssetId !== nextBannerAsset?.id
      ) {
        await touchOrMarkFileAssetOrphaned(
          tx,
          existingCategory.bannerImageFileAssetId,
        );
      }

      return category;
    });

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actionType: "CATEGORY_UPDATED",
      targetEntityType: "CATEGORY",
      targetEntityId: updatedCategory.id,
      summary: `Updated category ${updatedCategory.name}.`,
      metadata: {
        slug: updatedCategory.slug,
        parentId: updatedCategory.parentId,
      },
    });

    revalidatePath("/dashboard/admin/categories");
    return {
      success: "Category updated successfully",
      updatedCategory: mapCategoryMedia(updatedCategory),
    };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong while updating category" };
  }
};

export const getCategoriesAction = async () => {
  try {
    const categories = await prisma.category.findMany({
      include: categoryMediaInclude,
      orderBy: { name: "asc" },
    });

    return { categories: categories.map(mapCategoryMedia) };
  } catch (error) {
    console.error("Error fetching categories", error);
    return { error: "Failed to load categories" };
  }
};

export const adminDeleteCategoryAction = async (categoryId: string) => {
  const user = await CurrentUser();
  if (!user) return { error: "Unauthorized access" };
  if (user.role !== "ADMIN") return { error: "Access denied" };

  try {
    // Prevent deleting categories with children
    const children = await prisma.category.count({
      where: { parentId: categoryId },
    });

    if (children > 0)
      return { error: "Cannot delete category with subcategories" };

    await prisma.category.delete({ where: { id: categoryId } });

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role,
      actionType: "CATEGORY_DELETED",
      targetEntityType: "CATEGORY",
      targetEntityId: categoryId,
      summary: "Deleted category.",
    });

    revalidatePath("/dashboard/admin/categories");
    return { success: "Category deleted successfully" };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong while deleting category" };
  }
};

export const getHierarchicalCategories = async () => {
  return prisma.category.findMany({
    where: { parentId: null },
    include: {
      ...categoryMediaInclude,
      children: {
        include: {
          ...categoryMediaInclude,
          children: {
            include: categoryMediaInclude,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  }).then((categories) =>
    categories.map((category) => ({
      ...mapCategoryMedia(category),
      children: category.children.map((child) => ({
        ...mapCategoryMedia(child),
        children: child.children.map(mapCategoryMedia),
      })),
    })),
  );
};

