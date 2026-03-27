import { prisma } from "@/lib/prisma";
import { categoryMediaInclude, mapCategoryMedia } from "@/lib/media-views";

export const getStructuredCategories = async () => {
  const categories = await prisma.category.findMany({
    include: categoryMediaInclude,
    orderBy: { name: "asc" },
  });
  const normalizedCategories = categories.map(mapCategoryMedia);

  const parents = normalizedCategories.filter((c) => !c.parentId);
  return parents.map((parent) => ({
    ...parent,
    children: normalizedCategories.filter((c) => c.parentId === parent.id),
  }));
};
