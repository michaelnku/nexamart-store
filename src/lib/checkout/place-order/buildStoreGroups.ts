import "server-only";

import type { DeliveryType } from "@/generated/prisma/client";
import { calculatePlatformCommission } from "@/lib/finance/calculatePlatformCommission";
import { calculateDrivingDistance } from "@/lib/shipping/mapboxDistance";
import { calculateStoreDeliveryFee } from "@/lib/shipping/shippingCalculator";
import type { OrderPricingSiteConfig } from "@/lib/site-config/siteConfig.order";
import { PlaceOrderError } from "./placeOrder.errors";
import type {
  PricedCartItems,
  StoreGroup,
  ValidatedOrderAddress,
} from "./placeOrder.types";

export async function buildStoreGroups({
  pricedCartItems,
  address,
  deliveryType,
  pricingConfig,
}: {
  pricedCartItems: PricedCartItems;
  address: ValidatedOrderAddress;
  deliveryType: DeliveryType;
  pricingConfig: OrderPricingSiteConfig;
}): Promise<StoreGroup[]> {
  const itemsByStore = new Map<string, typeof pricedCartItems>();

  for (const item of pricedCartItems) {
    const storeId = item.product.store.id;
    if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
    itemsByStore.get(storeId)!.push(item);
  }

  const isPickupDelivery =
    deliveryType === "STORE_PICKUP" || deliveryType === "STATION_PICKUP";

  const storeEntries = await Promise.all(
    Array.from(itemsByStore.entries()).map(async ([storeId, items]) => {
      const store = items[0].product.store;
      let shippingFee = 0;
      let distanceInMiles = 0;

      if (!isPickupDelivery) {
        if (store.latitude == null || store.longitude == null) {
          throw new PlaceOrderError(
            `Store coordinates are missing for store ${storeId}.`,
          );
        }

        const distance = await calculateDrivingDistance(
          {
            latitude: store.latitude,
            longitude: store.longitude,
          },
          {
            latitude: address.latitude!,
            longitude: address.longitude!,
          },
        );

        distanceInMiles = distance.distanceInMiles;
        shippingFee = calculateStoreDeliveryFee({
          distanceInMiles,
          storeType: store.type,
          storeRatePerMile: store.shippingRatePerMile,
          deliveryType,
          config: pricingConfig,
        });
      }

      const subtotal = items.reduce((sum, item) => sum + item.lineTotalUSD, 0);

      const commissionRate = pricingConfig.platformCommissionRate;

      const { platformCommission, sellerRevenue } =
        calculatePlatformCommission(subtotal, commissionRate);

      return {
        storeId,
        sellerId: store.userId!,
        storeName: store.name!,
        storeType: store.type,
        commissionRate,

        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId!,
          quantity: item.quantity,
          priceUSD: item.unitPriceUSD,
          basePriceUSD: item.basePriceUSD,
          optionsPriceUSD: item.optionsPriceUSD,
          lineTotalUSD: item.lineTotalUSD,
          selectedOptions: item.selectedOptions.map((selection) => ({
            optionGroupName: selection.optionGroupName,
            optionName: selection.optionName,
            priceDeltaUSD: selection.priceDeltaUSD,
          })),
        })),

        subtotal,

        sellerRevenue,
        platformCommission,

        shippingFee,
        distanceInMiles,
      } satisfies StoreGroup;
    }),
  );

  return storeEntries;
}

