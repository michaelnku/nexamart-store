"use server";

import { revalidatePath } from "next/cache";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { recalculateStoreReviewAggregates } from "@/lib/reviews/store-review-aggregates";
import { deleteStoreReviewSchema } from "@/lib/reviews/store-review-validation";

function revalidateStoreReviewPaths(storeSlug: string) {
  revalidatePath(`/store/${storeSlug}`);
  revalidatePath("/marketplace/dashboard");
  revalidatePath("/marketplace/dashboard/seller/store");
  revalidatePath("/marketplace/dashboard/seller/reports");
}

export async function deleteStoreReview(input: { reviewId: string }) {
  const userId = await CurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const parsed = deleteStoreReviewSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid store review payload.");
  }

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

    await tx.storeReview.delete({
      where: {
        id: existingReview.id,
      },
    });

    const aggregates = await recalculateStoreReviewAggregates(
      tx,
      existingReview.storeId,
    );

    return {
      averageRating: aggregates.averageRating,
      reviewCount: aggregates.reviewCount,
      storeSlug: existingReview.store.slug,
    };
  });

  revalidateStoreReviewPaths(result.storeSlug);

  return {
    success: true,
    averageRating: result.averageRating,
    reviewCount: result.reviewCount,
  };
}

