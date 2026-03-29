import "server-only";

import { DeliveryType } from "@/generated/prisma/client";
import type { AuthoritativeCartLine } from "@/lib/checkout/cartPricing";
import type { OrderPricingSiteConfig } from "@/lib/site-config/siteConfig.order";
import { calculateDrivingDistance } from "@/lib/shipping/mapboxDistance";
import { calculateStoreDeliveryFee } from "@/lib/shipping/shippingCalculator";

export async function calculateStorePreviewMetrics({
  itemsByStore,
  addressLatitude,
  addressLongitude,
  deliveryType,
  pricingConfig,
}: {
  itemsByStore: Map<string, AuthoritativeCartLine[]>;
  addressLatitude: number;
  addressLongitude: number;
  deliveryType: DeliveryType;
  pricingConfig: OrderPricingSiteConfig;
}): Promise<
  ReadonlyArray<readonly [string, { shippingFee: number; distanceInMiles: number }]>
> {
  return Promise.all(
    Array.from(itemsByStore.entries()).map(async ([storeId, items]) => {
      const store = items[0].product.store;
      if (store.latitude == null || store.longitude == null) {
        throw new Error(`Store coordinates are missing for store ${storeId}.`);
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

      const finalShippingFee = calculateStoreDeliveryFee({
        distanceInMiles: distance.distanceInMiles,
        storeType: store.type,
        storeRatePerMile: store.shippingRatePerMile,
        deliveryType,
        config: pricingConfig,
      });

      return [
        storeId,
        {
          shippingFee: finalShippingFee,
          distanceInMiles: distance.distanceInMiles,
        },
      ] as const;
    }),
  );
}
