import { resolveCouponForOrder } from "@/lib/coupons/resolveCouponForOrder";
import { buildAuthoritativePayoutBasis } from "@/lib/payout/payoutBasis";
import type { InternalOrderGroup } from "./placeOrder.types";

export async function resolveCheckoutCouponAndPayoutBasis({
  userId,
  couponId,
  checkoutSubtotal,
  checkoutShippingFee,
  orderGroups,
}: {
  userId: string;
  couponId?: string | null;
  checkoutSubtotal: number;
  checkoutShippingFee: number;
  orderGroups: InternalOrderGroup[];
}) {
  const couponResult = await resolveCouponForOrder({
    userId,
    couponId,
    subtotalUSD: checkoutSubtotal,
    shippingUSD: checkoutShippingFee,
  });

  if ("error" in couponResult) {
    return { error: couponResult.error } as const;
  }

  const checkoutDiscountAmount = couponResult.discountAmount ?? 0;
  const checkoutTotalAmount = Math.max(
    0,
    checkoutSubtotal + checkoutShippingFee - checkoutDiscountAmount,
  );

  const updatedOrderGroups = buildAuthoritativePayoutBasis({
    orderGroups,
    couponType: couponResult.coupon?.type ?? null,
    totalDiscountAmount: checkoutDiscountAmount,
  });

  return {
    couponResult,
    checkoutDiscountAmount,
    checkoutTotalAmount,
    orderGroups: updatedOrderGroups,
  } as const;
}

