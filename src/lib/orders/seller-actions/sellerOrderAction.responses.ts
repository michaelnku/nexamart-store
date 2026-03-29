import type { SellerOrderActionResult } from "./sellerOrderAction.types";

export const SELLER_ORDER_ACTION_ERROR_MESSAGE =
  "We couldn't update this order right now. Please refresh and try again.";

export function actionSuccess(
  success: string,
  alreadyDone = false,
  warning?: string,
): SellerOrderActionResult {
  return { success, alreadyDone, warning };
}

export function actionError(
  error = SELLER_ORDER_ACTION_ERROR_MESSAGE,
): SellerOrderActionResult {
  return { error };
}

