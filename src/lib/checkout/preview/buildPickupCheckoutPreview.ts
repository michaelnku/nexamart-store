import "server-only";

import { resolveCouponForOrder } from "@/lib/coupons/resolveCouponForOrder";
import type { OrderPricingSiteConfig } from "@/lib/site-config/siteConfig.order";
import type {
  CheckoutPreviewResult,
  CheckoutPreviewSuccess,
} from "./preview.types";

export async function buildPickupCheckoutPreview({
  userId,
  couponId,
  subtotalUSD,
  pricingConfig,
}: {
  userId: string;
  couponId?: string | null;
  subtotalUSD: number;
  pricingConfig: OrderPricingSiteConfig;
}): Promise<CheckoutPreviewResult> {
  const pickupFee = pricingConfig.pickupFee;

  const couponResult = await resolveCouponForOrder({
    userId,
    couponId,
    subtotalUSD,
    shippingUSD: pickupFee,
  });

  if ("error" in couponResult) {
    return { error: couponResult.error };
  }

  const discountUSD = couponResult.discountAmount ?? 0;
  const totalUSD = Math.max(0, subtotalUSD + pickupFee - discountUSD);

  const result: CheckoutPreviewSuccess = {
    subtotalUSD,
    shippingFeeUSD: pickupFee,
    discountUSD,
    totalUSD,
    totalDistanceInMiles: 0,
    storeBreakdown: [],
  };

  return result;
}
