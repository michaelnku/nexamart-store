import type { DeliveryType } from "@/generated/prisma/client";
import { splitDiscountAcrossGroups } from "./splitDiscountAcrossGroups";
import type { InternalOrderGroup } from "./placeOrder.types";

export function applyPickupOrDeliveryAllocation({
  orderGroups,
  deliveryType,
  pricingConfig,
}: {
  orderGroups: InternalOrderGroup[];
  deliveryType: DeliveryType;
  pricingConfig: { pickupFee: number };
}) {
  let nextOrderGroups = orderGroups;
  let checkoutShippingFee = 0;
  let checkoutDistanceInMiles = 0;

  const isPickupDelivery =
    deliveryType === "STORE_PICKUP" || deliveryType === "STATION_PICKUP";

  if (isPickupDelivery) {
    checkoutShippingFee = pricingConfig.pickupFee;
    checkoutDistanceInMiles = 0;

    if (checkoutShippingFee > 0) {
      const subtotalBase = nextOrderGroups.reduce(
        (sum, group) => sum + group.subtotal,
        0,
      );

      const shippingAllocations =
        subtotalBase > 0
          ? splitDiscountAcrossGroups(
              nextOrderGroups.map((group) => ({ baseAmount: group.subtotal })),
              checkoutShippingFee,
            )
          : nextOrderGroups.map((_, index) =>
              index === 0 ? checkoutShippingFee : 0,
            );

      nextOrderGroups = nextOrderGroups.map((group, index) => ({
        ...group,
        shippingFee: shippingAllocations[index],
        distanceInMiles: 0,
      }));
    } else {
      nextOrderGroups = nextOrderGroups.map((group) => ({
        ...group,
        shippingFee: 0,
        distanceInMiles: 0,
      }));
    }
  } else {
    checkoutShippingFee = nextOrderGroups.reduce(
      (sum, group) => sum + group.shippingFee,
      0,
    );
    checkoutDistanceInMiles =
      nextOrderGroups.reduce((sum, group) => sum + group.distanceInMiles, 0) /
      nextOrderGroups.length;
  }

  return {
    orderGroups: nextOrderGroups,
    checkoutShippingFee,
    checkoutDistanceInMiles,
  };
}

