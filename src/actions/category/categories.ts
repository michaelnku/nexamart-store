"use server";

import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
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

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
        iconImage: iconImage || null,
        bannerImage: bannerImage || null,
        color,
      },
    });

    revalidatePath("/market-place/dashboard/admin/products");
    return { success: "Category created successfully", category };
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

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
        parentId: parentId || null,
        iconImage: iconImage ?? undefined,
        bannerImage: bannerImage ?? undefined,
        color,
      },
    });

    revalidatePath("/dashboard/admin/categories");
    return { success: "Category updated successfully", updatedCategory };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong while updating category" };
  }
};

export const getCategoriesAction = async () => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return { categories };
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
    include: { children: { include: { children: true } } },
    orderBy: { name: "asc" },
  });
};
