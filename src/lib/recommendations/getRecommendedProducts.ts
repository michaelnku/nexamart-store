import { prisma } from "@/lib/prisma";

type GetRecommendedProductsOptions = {
  recentIds?: string[];
  limit?: number;
};

export async function getRecommendedProducts(
  userId: string,
  options: GetRecommendedProductsOptions = {},
) {
  if (!userId) return [];

  const LIMIT = options.limit ?? 12;
  const recentIds = (options.recentIds ?? []).slice(0, 20);

  const purchasedItems = await prisma.orderItem.findMany({
    where: {
      order: {
        userId,
        status: "COMPLETED",
      },
    },
    select: {
      productId: true,
      quantity: true,
      product: {
        select: {
          categoryId: true,
        },
      },
    },
  });

  const purchasedProductIds = Array.from(
    new Set(purchasedItems.map((item) => item.productId)),
  );

  const categoryCount = new Map<string, number>();
  for (const item of purchasedItems) {
    const current = categoryCount.get(item.product.categoryId) ?? 0;
    categoryCount.set(item.product.categoryId, current + item.quantity);
  }

  const purchasedTopCategories = [...categoryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoryId]) => categoryId);

  if (purchasedTopCategories.length > 0) {
    const productsFromPurchasedCategories = await prisma.product.findMany({
      where: {
        isPublished: true,
        categoryId: { in: purchasedTopCategories },
        id: { notIn: purchasedProductIds },
      },
      include: {
        images: true,
        variants: true,
        store: true,
      },
      orderBy: [{ sold: "desc" }, { createdAt: "desc" }],
      take: LIMIT,
    });

    if (productsFromPurchasedCategories.length > 0) {
      return productsFromPurchasedCategories;
    }
  }

  if (recentIds.length > 0) {
    const recentProducts = await prisma.product.findMany({
      where: { id: { in: recentIds } },
      select: { categoryId: true },
    });

    const recentCategoryIds = Array.from(
      new Set(recentProducts.map((product) => product.categoryId)),
    );

    if (recentCategoryIds.length > 0) {
      const productsFromViewedCategories = await prisma.product.findMany({
        where: {
          isPublished: true,
          categoryId: { in: recentCategoryIds },
          id: { notIn: purchasedProductIds },
        },
        include: {
          images: true,
          variants: true,
          store: true,
        },
        orderBy: [{ sold: "desc" }, { createdAt: "desc" }],
        take: LIMIT,
      });

      if (productsFromViewedCategories.length > 0) {
        return productsFromViewedCategories;
      }
    }
  }

  const topSellers = await prisma.product.findMany({
    where: {
      isPublished: true,
      id: { notIn: purchasedProductIds },
    },
    include: {
      images: true,
      variants: true,
      store: true,
    },
    orderBy: { sold: "desc" },
    take: Math.ceil(LIMIT / 2),
  });

  const topSellerIds = topSellers.map((product) => product.id);

  const trendingProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      id: { notIn: [...purchasedProductIds, ...topSellerIds] },
    },
    include: {
      images: true,
      variants: true,
      store: true,
    },
    orderBy: [{ createdAt: "desc" }, { sold: "desc" }],
    take: LIMIT - topSellers.length,
  });

  return [...topSellers, ...trendingProducts];
}
