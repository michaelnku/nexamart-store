"use server";

import { revalidatePath } from "next/cache";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { recalculateStoreReviewAggregates } from "@/lib/reviews/store-review-aggregates";
import {
  normalizeStoreReviewPayload,
  updateStoreReviewSchema,
} from "@/lib/reviews/store-review-validation";

function revalidateStoreReviewPaths(storeSlug: string) {
  revalidatePath(`/store/${storeSlug}`);
  revalidatePath("/marketplace/dashboard");
  revalidatePath("/marketplace/dashboard/seller/store");
  revalidatePath("/marketplace/dashboard/seller/reports");
}

export async function updateStoreReview(input: {
  reviewId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
}) {
  const userId = await CurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const parsed = updateStoreReviewSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid store review payload.");
  }

  const normalizedPayload = normalizeStoreReviewPayload(parsed.data);

  const result = await prisma.$transaction(async (tx) => {
    const existingReview = await tx.storeReview.findUnique({
      where: {
        id: parsed.data.reviewId,
      },
      select: {
        id: true,
        userId: true,
        storeId: true,
        store: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!existingReview || existingReview.userId !== userId) {
      throw new Error("Store review not found.");
    }

    const review = await tx.storeReview.update({
      where: {
        id: existingReview.id,
      },
      data: {
        rating: parsed.data.rating,
        title: normalizedPayload.title,
        comment: normalizedPayload.comment,
      },
      select: {
        id: true,
      },
    });

    const aggregates = await recalculateStoreReviewAggregates(
      tx,
      existingReview.storeId,
    );

    return {
      reviewId: review.id,
      averageRating: aggregates.averageRating,
      reviewCount: aggregates.reviewCount,
      storeSlug: existingReview.store.slug,
    };
  });

  revalidateStoreReviewPaths(result.storeSlug);

  return {
    success: true,
    reviewId: result.reviewId,
    averageRating: result.averageRating,
    reviewCount: result.reviewCount,
  };
}

