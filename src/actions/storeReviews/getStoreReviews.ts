"use server";

import { prisma } from "@/lib/prisma";
import {
  getStoreReviewsSchema,
  normalizeStoreReviewPagination,
} from "@/lib/reviews/store-review-validation";

export async function getStoreReviews(input: {
  storeId: string;
  page?: number;
  pageSize?: number;
}) {
  const parsed = getStoreReviewsSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid store review query.");
  }

  const { page, pageSize } = normalizeStoreReviewPagination(parsed.data);
  const skip = (page - 1) * pageSize;

  const [totalCount, reviews] = await Promise.all([
    prisma.storeReview.count({
      where: {
        storeId: parsed.data.storeId,
      },
    }),
    prisma.storeReview.findMany({
      where: {
        storeId: parsed.data.storeId,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      skip,
      take: pageSize,
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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items: reviews,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

