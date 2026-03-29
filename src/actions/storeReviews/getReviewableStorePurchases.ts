"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { getReviewableStorePurchases as getReviewableStorePurchasesForUser } from "@/lib/reviews/store-review-eligibility";
import { getReviewableStorePurchasesSchema } from "@/lib/reviews/store-review-validation";

export async function getReviewableStorePurchases(input: { storeId: string }) {
  const parsed = getReviewableStorePurchasesSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid reviewable store purchase query.");
  }

  const userId = await CurrentUserId();

  if (!userId) {
    return {
      isAuthenticated: false,
      canReview: false,
      purchases: [],
    };
  }

  const purchases = await getReviewableStorePurchasesForUser(
    userId,
    parsed.data.storeId,
  );

  return {
    isAuthenticated: true,
    canReview: purchases.length > 0,
    purchases,
  };
}
