const ONE_MINUTE_MS = 60 * 1000;

export const FOOD_DISPUTE_WINDOW_MS = 60 * ONE_MINUTE_MS;
export const FOOD_PAYOUT_HOLD_MS = 90 * ONE_MINUTE_MS;
export const DEFAULT_PAYOUT_HOLD_MS = 24 * 60 * ONE_MINUTE_MS;

export function getPayoutHoldMs(isFoodOrder: boolean) {
  return isFoodOrder ? FOOD_PAYOUT_HOLD_MS : DEFAULT_PAYOUT_HOLD_MS;
}

export function getPayoutEligibleAtFrom(baseTime: Date, isFoodOrder: boolean) {
  return new Date(baseTime.getTime() + getPayoutHoldMs(isFoodOrder));
}
