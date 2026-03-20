export const SELLER_DAILY_STATS_JOB_TYPE = "SELLER_DAILY_STATS";
export const FINALIZE_ORDER_JOB_TYPE = "FINALIZE_ORDER";
export const MARK_READY_JOB_TYPE = "MARK_READY";
export const LEGACY_MARK_SELLER_GROUP_READY_JOB_TYPE = "MARK_SELLER_GROUP_READY";

export const RELEASE_ORDER_PAYOUT_JOB_TYPE = "RELEASE_ORDER_PAYOUT";
export const RELEASE_ORDER_PAYOUT_JOB_ID_PREFIX = "release-order-payout";
export const REFERRAL_EXPIRY_JOB_TYPE = "REFERRAL_EXPIRY";
export const REFERRAL_EXPIRY_JOB_ID_PREFIX = "referral-expiry";
export const PROCESS_REFERRAL_REWARD_JOB_TYPE = "PROCESS_REFERRAL_REWARD";
export const PROCESS_REFERRAL_REWARD_JOB_ID_PREFIX = "process-referral-reward";

export function buildReleaseOrderPayoutJobId(orderId: string) {
  return `${RELEASE_ORDER_PAYOUT_JOB_ID_PREFIX}-${orderId}`;
}

export function buildReferralExpiryJobId(referralId: string) {
  return `${REFERRAL_EXPIRY_JOB_ID_PREFIX}-${referralId}`;
}

export function buildProcessReferralRewardJobId(referralId: string) {
  return `${PROCESS_REFERRAL_REWARD_JOB_ID_PREFIX}-${referralId}`;
}
