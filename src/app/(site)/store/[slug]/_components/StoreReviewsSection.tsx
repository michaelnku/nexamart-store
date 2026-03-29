import { CurrentUserId } from "@/lib/currentUser";
import { getReviewableStorePurchases } from "@/lib/reviews/store-review-eligibility";
import { prisma } from "@/lib/prisma";

import StoreReviewsSectionClient from "./StoreReviewsSectionClient";

async function getInitialStoreReviews(storeId: string) {
  const [store, breakdownRaw, reviews] = await Promise.all([
    prisma.store.findUnique({
      where: { id: storeId },
      select: {
        averageRating: true,
        reviewCount: true,
      },
    }),
    prisma.storeReview.groupBy({
      by: ["rating"],
      where: { storeId },
      _count: {
        rating: true,
      },
    }),
    prisma.storeReview.findMany({
      where: { storeId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 6,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
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
  const ratingBreakdownMap = new Map(
    breakdownRaw.map((entry) => [entry.rating, entry._count.rating]),
  );

  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => {
    const count = ratingBreakdownMap.get(rating) ?? 0;

    return {
      rating,
      count,
      percentage: reviewCount > 0 ? (count / reviewCount) * 100 : 0,
    };
  });

  return {
    summary: {
      averageRating,
      reviewCount,
      ratingBreakdown,
    },
    reviewsPage: {
      items: reviews,
      page: 1,
      pageSize: 6,
      totalCount: reviewCount,
      totalPages: Math.max(1, Math.ceil(reviewCount / 6)),
      hasNextPage: reviewCount > 6,
      hasPreviousPage: false,
    },
  };
}

export default async function StoreReviewsSection({
  store,
}: {
  store: {
    id: string;
    slug: string;
    name: string;
  };
}) {
  const userId = await CurrentUserId();
  const [{ summary, reviewsPage }, reviewablePurchases] = await Promise.all([
    getInitialStoreReviews(store.id),
    userId ? getReviewableStorePurchases(userId, store.id) : Promise.resolve([]),
  ]);

  return (
    <StoreReviewsSectionClient
      store={store}
      initialSummary={summary}
      initialReviewsPage={reviewsPage}
      initialReviewablePurchases={reviewablePurchases}
      isAuthenticated={Boolean(userId)}
    />
  );
}

