import { prisma } from "@/lib/prisma";

export const getStructuredCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const parents = categories.filter((c) => !c.parentId);
  return parents.map((parent) => ({
    ...parent,
    children: categories.filter((c) => c.parentId === parent.id),
  }));
};
