type SplitInput = {
  baseAmount: number;
};

type StoreGroupBasis = {
  subtotal: number;
  sellerRevenue: number;
  platformCommission: number;
  commissionRate: number;
};

type OrderGroupBasis<TStore extends StoreGroupBasis> = {
  subtotal: number;
  shippingFee: number;
  stores: TStore[];
};

type BuildAuthoritativePayoutBasisInput<
  TStore extends StoreGroupBasis,
  TGroup extends OrderGroupBasis<TStore>,
> = {
  orderGroups: TGroup[];
  couponType?: string | null;
  totalDiscountAmount: number;
};

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

function splitAmountAcrossGroups(
  groups: SplitInput[],
  totalAmount: number,
): number[] {
  if (groups.length === 0 || totalAmount <= 0) {
    return groups.map(() => 0);
  }

  const totalBase = roundToCents(
    groups.reduce((sum, group) => sum + Math.max(0, group.baseAmount), 0),
  );

  if (totalBase <= 0) {
    return groups.map(() => 0);
  }

  const cappedTotal = Math.min(roundToCents(totalAmount), totalBase);
  const rawAllocations = groups.map((group) =>
    (Math.max(0, group.baseAmount) / totalBase) * cappedTotal,
  );
  const floored = rawAllocations.map((value) => Math.floor(value * 100) / 100);
  const flooredTotal = roundToCents(floored.reduce((sum, value) => sum + value, 0));
  let remainderCents = Math.max(
    0,
    Math.round((cappedTotal - flooredTotal) * 100),
  );

  const sortedIndexes = rawAllocations
    .map((value, index) => ({ index, fraction: value - floored[index] }))
    .sort((a, b) => b.fraction - a.fraction)
    .map((entry) => entry.index);

  for (let i = 0; i < remainderCents; i += 1) {
    const targetIndex = sortedIndexes[i % sortedIndexes.length];
    floored[targetIndex] = roundToCents(floored[targetIndex] + 0.01);
  }

  return floored.map((value) => roundToCents(value));
}

function resolveDiscountAllocations<TStore extends StoreGroupBasis>(
  orderGroups: OrderGroupBasis<TStore>[],
  couponType: string | null | undefined,
  totalDiscountAmount: number,
) {
  if (couponType === "FREE_SHIPPING") {
    return {
      merchandiseDiscounts: orderGroups.map(() => 0),
      shippingDiscounts: splitAmountAcrossGroups(
        orderGroups.map((group) => ({ baseAmount: group.shippingFee })),
        totalDiscountAmount,
      ),
    };
  }

  return {
    merchandiseDiscounts: splitAmountAcrossGroups(
      orderGroups.map((group) => ({ baseAmount: group.subtotal })),
      totalDiscountAmount,
    ),
    shippingDiscounts: orderGroups.map(() => 0),
  };
}

export function buildAuthoritativePayoutBasis<
  TStore extends StoreGroupBasis,
  TGroup extends OrderGroupBasis<TStore>,
>(
  input: BuildAuthoritativePayoutBasisInput<TStore, TGroup>,
) {
  const { merchandiseDiscounts, shippingDiscounts } = resolveDiscountAllocations(
    input.orderGroups,
    input.couponType,
    input.totalDiscountAmount,
  );

  return input.orderGroups.map((group, groupIndex) => {
    const merchandiseDiscount = merchandiseDiscounts[groupIndex] ?? 0;
    const shippingDiscount = shippingDiscounts[groupIndex] ?? 0;
    const fundedSubtotal = roundToCents(
      Math.max(0, group.subtotal - merchandiseDiscount),
    );
    const riderPayoutAmount = roundToCents(
      Math.max(0, group.shippingFee - shippingDiscount),
    );
    const storeDiscounts = splitAmountAcrossGroups(
      group.stores.map((store) => ({ baseAmount: store.subtotal })),
      merchandiseDiscount,
    );

    const stores = group.stores.map((store, storeIndex) => {
      const fundedGross = roundToCents(
        Math.max(0, store.subtotal - (storeDiscounts[storeIndex] ?? 0)),
      );
      const platformCommission = roundToCents(
        Math.min(fundedGross, fundedGross * store.commissionRate),
      );
      const sellerRevenue = roundToCents(
        Math.max(0, fundedGross - platformCommission),
      );

      return {
        ...store,
        sellerRevenue,
        platformCommission,
      };
    });

    return {
      ...group,
      stores,
      totalAmount: roundToCents(fundedSubtotal + riderPayoutAmount),
      riderPayoutAmount,
    };
  });
}
