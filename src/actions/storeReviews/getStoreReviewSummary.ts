"use server";

import { prisma } from "@/lib/prisma";
import { getStoreReviewSummarySchema } from "@/lib/reviews/store-review-validation";

export async function getStoreReviewSummary(input: { storeId: string }) {
  const parsed = getStoreReviewSummarySchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid store review summary query.");
  }

  const [store, breakdownRaw, recentReviews] = await Promise.all([
    prisma.store.findUnique({
      where: {
        id: parsed.data.storeId,
      },
      select: {
        averageRating: true,
        reviewCount: true,
      },
    }),
    prisma.storeReview.groupBy({
      by: ["rating"],
      where: {
        storeId: parsed.data.storeId,
      },
      _count: {
        rating: true,
      },
    }),
    prisma.storeReview.findMany({
      where: {
        storeId: parsed.data.storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    }),
  ]);

  const reviewCount = store?.reviewCount ?? 0;
  const averageRating = store?.averageRating ?? 0;
  const breakdownMap = new Map(
    breakdownRaw.map((entry) => [entry.rating, entry._count.rating]),
  );

  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => {
    const count = breakdownMap.get(rating) ?? 0;

    return {
      rating,
      count,
      percentage: reviewCount > 0 ? (count / reviewCount) * 100 : 0,
    };
  });

  return {
    averageRating,
    reviewCount,
    ratingBreakdown,
    recentReviews,
  };
}

