import type { Prisma } from "@/generated/prisma";

export async function recalculateStoreReviewAggregates(
  tx: Prisma.TransactionClient,
  storeId: string,
) {
  const [reviewCount, averageResult] = await Promise.all([
    tx.storeReview.count({
      where: { storeId },
    }),
    tx.storeReview.aggregate({
      where: { storeId },
      _avg: {
        rating: true,
      },
    }),
  ]);

  const averageRating = averageResult._avg.rating ?? 0;

  await tx.store.update({
    where: { id: storeId },
    data: {
      averageRating,
      reviewCount,
    },
  });

  return {
    averageRating,
    reviewCount,
  };
}

