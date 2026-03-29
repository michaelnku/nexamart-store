"use server";

import { revalidatePath } from "next/cache";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { recalculateStoreReviewAggregates } from "@/lib/reviews/store-review-aggregates";
import { assertStoreReviewEligibility } from "@/lib/reviews/store-review-eligibility";
import {
  createStoreReviewSchema,
  normalizeStoreReviewPayload,
} from "@/lib/reviews/store-review-validation";

function revalidateStoreReviewPaths(storeSlug: string) {
  revalidatePath(`/store/${storeSlug}`);
  revalidatePath("/marketplace/dashboard");
  revalidatePath("/marketplace/dashboard/seller/store");
  revalidatePath("/marketplace/dashboard/seller/reports");
}

export async function createStoreReview(input: {
  storeId: string;
  orderId: string;
  sellerGroupId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
}) {
  const userId = await CurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const parsed = createStoreReviewSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid store review payload.");
  }

  const normalizedPayload = normalizeStoreReviewPayload(parsed.data);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const eligiblePurchase = await assertStoreReviewEligibility(
        {
          userId,
          storeId: parsed.data.storeId,
          sellerGroupId: parsed.data.sellerGroupId,
          orderId: parsed.data.orderId,
        },
        tx,
      );

      const existingReview = await tx.storeReview.findUnique({
        where: {
          sellerGroupId_userId: {
            sellerGroupId: eligiblePurchase.sellerGroupId,
            userId,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingReview) {
        throw new Error(
          "You already have a store review for this completed purchase.",
        );
      }

      const review = await tx.storeReview.create({
        data: {
          storeId: eligiblePurchase.storeId,
          userId,
          orderId: eligiblePurchase.orderId,
          sellerGroupId: eligiblePurchase.sellerGroupId,
          rating: parsed.data.rating,
          title: normalizedPayload.title,
          comment: normalizedPayload.comment,
        },
        select: {
          id: true,
          storeId: true,
        },
      });

      const aggregates = await recalculateStoreReviewAggregates(
        tx,
        eligiblePurchase.storeId,
      );

      return {
        review,
        aggregates,
        storeSlug: eligiblePurchase.storeSlug,
      };
    });

    revalidateStoreReviewPaths(result.storeSlug);

    return {
      success: true,
      reviewId: result.review.id,
      averageRating: result.aggregates.averageRating,
      reviewCount: result.aggregates.reviewCount,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new Error(
        "You already have a store review for this completed purchase.",
      );
    }

    throw error;
  }
}
