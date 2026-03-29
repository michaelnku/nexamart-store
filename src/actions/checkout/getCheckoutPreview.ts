"use server";

import { DeliveryType } from "@/generated/prisma/client";
import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { buildDeliveryCheckoutPreview } from "@/lib/checkout/preview/buildDeliveryCheckoutPreview";
import { buildPickupCheckoutPreview } from "@/lib/checkout/preview/buildPickupCheckoutPreview";
import { loadCheckoutPreviewAddress } from "@/lib/checkout/preview/loadCheckoutPreviewAddress";
import { loadCheckoutPreviewCart } from "@/lib/checkout/preview/loadCheckoutPreviewCart";
export type {
  CheckoutPreviewResult,
  CheckoutPreviewSuccess,
  StoreShippingBreakdown,
} from "@/lib/checkout/preview/preview.types";
import type { CheckoutPreviewResult } from "@/lib/checkout/preview/preview.types";
import { getOrderPricingSiteConfig } from "@/lib/site-config/siteConfig.order";
import { resolveAuthoritativeCartLines } from "@/lib/checkout/cartPricing";

export async function getCheckoutPreviewAction({
  addressId,
  deliveryType,
  couponId,
}: {
  addressId: string;
  deliveryType: DeliveryType;
  couponId?: string | null;
}): Promise<CheckoutPreviewResult> {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const cart = await loadCheckoutPreviewCart(userId);

  if (!cart || cart.items.length === 0) {
    return { error: "Cart is empty" };
  }

  let pricedCartItems;
  try {
    pricedCartItems = await resolveAuthoritativeCartLines(prisma, cart.items);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cart validation failed.";
    return { error: message };
  }

  const address = await loadCheckoutPreviewAddress({ addressId, userId });

  if (!address) {
    return { error: "Invalid address" };
  }

  const subtotalUSD = pricedCartItems.reduce(
    (sum, item) => sum + item.lineTotalUSD,
    0,
  );

  const pricingConfig = await getOrderPricingSiteConfig();

  if (deliveryType === "STORE_PICKUP" || deliveryType === "STATION_PICKUP") {
    return buildPickupCheckoutPreview({
      userId,
      couponId,
      subtotalUSD,
      pricingConfig,
    });
  }

  return buildDeliveryCheckoutPreview({
    userId,
    couponId,
    subtotalUSD,
    deliveryType,
    address,
    pricedCartItems,
    pricingConfig,
  });
}
