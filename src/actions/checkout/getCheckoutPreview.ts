"use server";

import { DeliveryType, StoreType } from "@/generated/prisma/client";
import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { resolveCouponForOrder } from "@/lib/coupons/resolveCouponForOrder";
import { calculateDrivingDistance } from "@/lib/shipping/mapboxDistance";
import { calculateShippingFee } from "@/lib/shipping/shippingCalculator";

export type StoreShippingBreakdown = {
  storeId: string;
  distanceInMiles: number;
  shippingFeeUSD: number;
  //storeName: string;
  //storeType: StoreType;
};

export type CheckoutPreviewSuccess = {
  subtotalUSD: number;
  shippingFeeUSD: number;
  discountUSD: number;
  totalUSD: number;
  totalDistanceInMiles: number;
  storeBreakdown: StoreShippingBreakdown[];
};

export type CheckoutPreviewResult = CheckoutPreviewSuccess | { error: string };

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

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              store: {
                select: {
                  id: true,
                  shippingRatePerMile: true,
                  latitude: true,
                  longitude: true,
                  type: true,
                },
              },
            },
          },
          variant: {
            select: { priceUSD: true },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Cart is empty" };
  }

  for (const item of cart.items) {
    if (!item.variant) {
      return { error: "Invalid cart item. Please reselect product variant." };
    }
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
    select: {
      id: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!address) {
    return { error: "Invalid address" };
  }

  if (address.latitude == null || address.longitude == null) {
    return {
      error: "Selected address is missing coordinates. Please update address.",
    };
  }

  const addressLatitude = address.latitude;
  const addressLongitude = address.longitude;

  const subtotalUSD = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.variant!.priceUSD,
    0,
  );

  if (deliveryType === "STORE_PICKUP" || deliveryType === "STATION_PICKUP") {
    const couponResult = await resolveCouponForOrder({
      userId,
      couponId,
      subtotalUSD,
      shippingUSD: 0,
    });

    if ("error" in couponResult) {
      return { error: couponResult.error };
    }

    const discountUSD = couponResult.discountAmount ?? 0;
    const totalUSD = Math.max(0, subtotalUSD - discountUSD);

    return {
      subtotalUSD,
      shippingFeeUSD: 0,
      discountUSD,
      totalUSD,
      totalDistanceInMiles: 0,
      storeBreakdown: [],
    };
  }

  const itemsByStore = new Map<string, typeof cart.items>();
  for (const item of cart.items) {
    const storeId = item.product.store.id;
    if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
    itemsByStore.get(storeId)!.push(item);
  }

  const siteConfig = await prisma.siteConfiguration.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      foodBaseDeliveryRate: true,
      foodRatePerMile: true,
      generalBaseDeliveryRate: true,
      generalRatePerMile: true,
      expressMultiplier: true,
    },
  });

  const expressMultiplier =
    deliveryType === "EXPRESS" ? (siteConfig?.expressMultiplier ?? 1.5) : 1;

  let storeMetricsEntries: ReadonlyArray<
    readonly [string, { shippingFee: number; distanceInMiles: number }]
  >;

  try {
    storeMetricsEntries = await Promise.all(
      Array.from(itemsByStore.entries()).map(async ([storeId, items]) => {
        const store = items[0].product.store;
        if (store.latitude == null || store.longitude == null) {
          throw new Error(
            `Store coordinates are missing for store ${storeId}.`,
          );
        }

        const distance = await calculateDrivingDistance(
          {
            latitude: store.latitude,
            longitude: store.longitude,
          },
          {
            latitude: addressLatitude,
            longitude: addressLongitude,
          },
        );

        const isFood = store.type === "FOOD";

        // const minimumFee = isFood
        //   ? (siteConfig?.foodMinimumDeliveryFee ?? 2)
        //   : (siteConfig?.generalMinimumDeliveryFee ?? 5);

        const siteBase = isFood
          ? (siteConfig?.foodBaseDeliveryRate ?? 0)
          : (siteConfig?.generalBaseDeliveryRate ?? 0);

        const siteRate = isFood
          ? (siteConfig?.foodRatePerMile ?? 0)
          : (siteConfig?.generalRatePerMile ?? 0);

        const effectiveRatePerMile =
          store.shippingRatePerMile && store.shippingRatePerMile > 0
            ? store.shippingRatePerMile
            : siteRate;

        const effectiveBaseFee = siteBase;

        const normalFee = calculateShippingFee({
          distanceInMiles: distance.distanceInMiles,
          ratePerMile: effectiveRatePerMile,
          baseFee: effectiveBaseFee,
          expressMultiplier: 1,
          //  minimumFee,
        });

        const maxCap = isFood ? 7.99 : 25;

        const cappedNormal = Math.min(normalFee, maxCap);

        const finalShippingFee =
          deliveryType === "EXPRESS"
            ? cappedNormal * expressMultiplier
            : cappedNormal;

        return [
          storeId,
          {
            shippingFee: finalShippingFee,
            distanceInMiles: distance.distanceInMiles,
          },
        ] as const;
      }),
    );
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
