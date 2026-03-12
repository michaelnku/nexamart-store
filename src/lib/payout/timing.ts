const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

export const FOOD_DISPUTE_WINDOW_MS = ONE_HOUR_MS;
export const FOOD_PAYOUT_HOLD_MS = 90 * ONE_MINUTE_MS;
export const GENERAL_DISPUTE_WINDOW_MS = 24 * ONE_HOUR_MS;
export const GENERAL_PAYOUT_HOLD_MS = 48 * ONE_HOUR_MS;

export function getPayoutHoldMs(isFoodOrder: boolean) {
  return isFoodOrder ? FOOD_PAYOUT_HOLD_MS : GENERAL_PAYOUT_HOLD_MS;
}

export function getPayoutEligibleAtFrom(baseTime: Date, isFoodOrder: boolean) {
  return new Date(baseTime.getTime() + getPayoutHoldMs(isFoodOrder));
}
