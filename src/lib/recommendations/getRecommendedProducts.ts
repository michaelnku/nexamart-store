import { prisma } from "@/lib/prisma";

export async function getRecommendedProducts(userId: string) {
  if (!userId) return [];

  const LIMIT = 12;

  const purchasedItems = await prisma.orderItem.findMany({
    where: {
      order: {
        userId,
        status: { in: ["DELIVERED", "COMPLETED"] },
        isPaid: true,
      },
    },
    select: {
      productId: true,
      product: {
        select: {
          categoryId: true,
        },
      },
    },
  });

  const purchasedProductIds = [
    ...new Set(purchasedItems.map((p) => p.productId)),
  ];

  const purchasedCategoryIds = [
    ...new Set(purchasedItems.map((p) => p.product.categoryId)),
  ];

  if (purchasedCategoryIds.length > 0) {
    const recommended = await prisma.product.findMany({
      where: {
        isPublished: true,
        categoryId: { in: purchasedCategoryIds },
        NOT: {
          id: { in: purchasedProductIds },
        },
      },
      include: {
        images: true,
        variants: true,
        store: true,
      },
      orderBy: {
        sold: "desc",
      },
      take: LIMIT,
    });

    if (recommended.length > 0) return recommended;
  }

  const recentViews = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (recentViews.length > 0) {
    const recentKeywords = recentViews.map((r) => r.query);

    const recommendedFromSearch = await prisma.product.findMany({
      where: {
        isPublished: true,
        name: {
          contains: recentKeywords[0],
          mode: "insensitive",
        },
      },
      include: {
        images: true,
        variants: true,
        store: true,
      },
      orderBy: {
        sold: "desc",
      },
      take: LIMIT,
    });

    if (recommendedFromSearch.length > 0) return recommendedFromSearch;
  }

  const topSellers = await prisma.product.findMany({
    where: {
      isPublished: true,
    },
    include: {
      images: true,
      variants: true,
      store: true,
    },
    orderBy: {
      sold: "desc",
    },
    take: LIMIT,
  });

  return topSellers;
}
