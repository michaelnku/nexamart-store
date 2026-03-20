"use server";

import { processReferralQualificationForPaidOrder } from "@/lib/referrals/referralLifecycle";

export const applyReferralRewardsForPaidOrder = async (orderId: string) => {
  await processReferralQualificationForPaidOrder(orderId);
};
