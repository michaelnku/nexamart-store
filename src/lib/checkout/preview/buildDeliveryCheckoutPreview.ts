import "server-only";

import { DeliveryType } from "@/generated/prisma/client";
import type { AuthoritativeCartLine } from "@/lib/checkout/cartPricing";
import { resolveCouponForOrder } from "@/lib/coupons/resolveCouponForOrder";
import type { OrderPricingSiteConfig } from "@/lib/site-config/siteConfig.order";
import { calculateStorePreviewMetrics } from "./calculateStorePreviewMetrics";
import { groupPricedItemsByStore } from "./groupPricedItemsByStore";
import type { CheckoutPreviewAddress } from "./loadCheckoutPreviewAddress";
import type {
  CheckoutPreviewResult,
  StoreShippingBreakdown,
} from "./preview.types";

export async function buildDeliveryCheckoutPreview({
  userId,
  couponId,
  subtotalUSD,
  deliveryType,
  address,
  pricedCartItems,
  pricingConfig,
}: {
  userId: string;
  couponId?: string | null;
  subtotalUSD: number;
  deliveryType: DeliveryType;
  address: CheckoutPreviewAddress;
  pricedCartItems: AuthoritativeCartLine[];
  pricingConfig: OrderPricingSiteConfig;
}): Promise<CheckoutPreviewResult> {
  if (address.latitude == null || address.longitude == null) {
    return {
      error: "Selected address is missing coordinates. Please update address.",
    };
  }

  const addressLatitude = address.latitude;
  const addressLongitude = address.longitude;
  const itemsByStore = groupPricedItemsByStore(pricedCartItems);

  let storeMetricsEntries: ReadonlyArray<
    readonly [string, { shippingFee: number; distanceInMiles: number }]
  >;

  try {
    storeMetricsEntries = await calculateStorePreviewMetrics({
      itemsByStore,
      addressLatitude,
      addressLongitude,
      deliveryType,
      pricingConfig,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to calculate shipping.";
    return { error: message };
  }

  const storeMetrics = new Map(storeMetricsEntries);

  const storeBreakdown: StoreShippingBreakdown[] = Array.from(
    storeMetrics.entries(),
  ).map(([storeId, metrics]) => ({
    storeId,
    distanceInMiles: metrics.distanceInMiles,
    shippingFeeUSD: metrics.shippingFee,
  }));

  const shippingFeeUSD = storeBreakdown.reduce(
    (sum, item) => sum + item.shippingFeeUSD,
    0,
  );

  const totalDistanceInMiles = storeBreakdown.reduce(
    (sum, item) => sum + item.distanceInMiles,
    0,
  );

  const couponResult = await resolveCouponForOrder({
    userId,
    couponId,
    subtotalUSD,
    shippingUSD: shippingFeeUSD,
  });

  if ("error" in couponResult) {
    return { error: couponResult.error };
  }

  const discountUSD = couponResult.discountAmount ?? 0;
  const totalUSD = Math.max(0, subtotalUSD + shippingFeeUSD - discountUSD);

  return {
    subtotalUSD,
    shippingFeeUSD,
    discountUSD,
    totalUSD,
    totalDistanceInMiles,
    storeBreakdown,
  };
}
