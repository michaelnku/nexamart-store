import "server-only";

import { completeOrderPaymentSideEffects } from "@/lib/payments/completeOrderPayment";
import { applyReferralRewardsForPaidOrder } from "@/lib/referrals/applyReferralRewards";
import type { CreatedOrdersPayload } from "./placeOrder.types";

export async function runWalletPostPaymentEffects({
  paidOrderIds,
  createdOrders,
  walletJustPaid,
}: {
  paidOrderIds: string[];
  createdOrders: CreatedOrdersPayload;
  walletJustPaid: boolean;
}) {
  const uniquePaidOrderIds = [...new Set(paidOrderIds)];
  if (uniquePaidOrderIds.length !== createdOrders.length) {
    return { error: "Wallet payment validation failed. Please try again." } as const;
  }

  for (const order of createdOrders) {
    await completeOrderPaymentSideEffects(order.id);
  }

  if (walletJustPaid) {
    for (const orderId of uniquePaidOrderIds) {
      await applyReferralRewardsForPaidOrder(orderId);
    }
  }

  return { success: true } as const;
}
