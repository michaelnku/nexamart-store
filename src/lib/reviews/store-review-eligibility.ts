import { Prisma, type PrismaClient } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const STORE_REVIEW_UNLOCK_STATUS = "COMPLETED" as const;

type StoreReviewDb = Prisma.TransactionClient | PrismaClient;

type ReviewableStorePurchaseRecord = {
  id: string;
  orderId: string;
  storeId: string;
  order: {
    id: string;
    createdAt: Date;
    trackingNumber: string | null;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
  storeReviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

function mapReviewableStorePurchase(group: ReviewableStorePurchaseRecord) {
  const existingReview = group.storeReviews[0] ?? null;

  return {
    sellerGroupId: group.id,
    orderId: group.orderId,
    storeId: group.storeId,
    storeName: group.store.name,
    storeSlug: group.store.slug,
    purchasedAt: group.order.createdAt,
    trackingNumber: group.order.trackingNumber,
    existingReview,
  };
}

export function buildStoreReviewEligibilityWhere(input: {
  userId: string;
  storeId: string;
}): Prisma.OrderSellerGroupWhereInput {
  return {
    storeId: input.storeId,
    cancelledAt: null,
    status: {
      not: "CANCELLED",
    },
    order: {
      userId: input.userId,
      isPaid: true,
      status: STORE_REVIEW_UNLOCK_STATUS,
    },
  };
}

export async function getReviewableStorePurchases(
  userId: string,
  storeId: string,
  db: StoreReviewDb = prisma,
) {
  const groups = await db.orderSellerGroup.findMany({
    where: buildStoreReviewEligibilityWhere({ userId, storeId }),
    orderBy: [
      {
        order: {
          createdAt: "desc",
        },
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      orderId: true,
      storeId: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          createdAt: true,
          trackingNumber: true,
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      storeReviews: {
        where: {
          userId,
        },
        take: 1,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return groups.map(mapReviewableStorePurchase);
}

export async function assertStoreReviewEligibility(
  input: {
    userId: string;
    storeId: string;
    sellerGroupId: string;
    orderId?: string | null;
  },
  db: StoreReviewDb = prisma,
) {
  const group = await db.orderSellerGroup.findFirst({
    where: {
      id: input.sellerGroupId,
      ...(input.orderId ? { orderId: input.orderId } : {}),
      ...buildStoreReviewEligibilityWhere({
        userId: input.userId,
        storeId: input.storeId,
      }),
    },
    select: {
      id: true,
      orderId: true,
      storeId: true,
      order: {
        select: {
          id: true,
          createdAt: true,
          trackingNumber: true,
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      storeReviews: {
        where: {
          userId: input.userId,
        },
        take: 1,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!group) {
    throw new Error(
      "You can only review stores for your own completed, non-cancelled purchases.",
    );
  }

  return mapReviewableStorePurchase(group);
}
