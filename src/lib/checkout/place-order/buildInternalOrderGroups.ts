import type { InternalOrderGroup, StoreGroup } from "./placeOrder.types";

export function buildInternalOrderGroups(
  storeGroups: StoreGroup[],
): InternalOrderGroup[] {
  const foodStoreGroups = storeGroups.filter(
    (group) => group.storeType === "FOOD",
  );
  const nonFoodStoreGroups = storeGroups.filter(
    (group) => group.storeType !== "FOOD",
  );

  return [
    ...foodStoreGroups.map((storeGroup) => ({
      isFoodOrder: true,
      stores: [storeGroup],
      subtotal: storeGroup.subtotal,
      shippingFee: storeGroup.shippingFee,
      distanceInMiles: storeGroup.distanceInMiles,
      riderPayoutAmount: storeGroup.shippingFee,
      totalAmount: 0,
    })),
    ...(nonFoodStoreGroups.length
      ? [
          {
            isFoodOrder: false,
            stores: nonFoodStoreGroups,
            subtotal: nonFoodStoreGroups.reduce(
              (sum, group) => sum + group.subtotal,
              0,
            ),
            shippingFee: nonFoodStoreGroups.reduce(
              (sum, group) => sum + group.shippingFee,
              0,
            ),
            distanceInMiles:
              nonFoodStoreGroups.reduce(
                (sum, group) => sum + group.distanceInMiles,
                0,
              ) / nonFoodStoreGroups.length,
            riderPayoutAmount: nonFoodStoreGroups.reduce(
              (sum, group) => sum + group.shippingFee,
              0,
            ),
            totalAmount: 0,
          } satisfies InternalOrderGroup,
        ]
      : []),
  ];
}

