import { prisma } from "@/lib/prisma";

export type StorePerformanceBadge =
  | "ELITE"
  | "RELIABLE"
  | "STANDARD"
  | "LOW_PERFORMANCE";

export type StorePrepPerformance = {
  totalOrders: number;
  lateOrders: number;
  onTimeOrders: number;
  onTimeRate: number;
  badge: StorePerformanceBadge;
  dispatchPriorityMultiplier: number;
  suggestedCommissionAdjustment: number;
};

const DEFAULT_PERFORMANCE: StorePrepPerformance = {
  totalOrders: 0,
  lateOrders: 0,
  onTimeOrders: 0,
  onTimeRate: 0,
  badge: "LOW_PERFORMANCE",
  dispatchPriorityMultiplier: 0.9,
  suggestedCommissionAdjustment: 1,
};

function badgeFromOnTimeRate(onTimeRate: number): StorePerformanceBadge {
  if (onTimeRate >= 95) return "ELITE";
  if (onTimeRate >= 85) return "RELIABLE";
  if (onTimeRate >= 70) return "STANDARD";
  return "LOW_PERFORMANCE";
}

function dispatchPriorityMultiplierFromBadge(
  badge: StorePerformanceBadge,
): number {
  switch (badge) {
    case "ELITE":
      return 1.2;
    case "RELIABLE":
      return 1.1;
    case "STANDARD":
      return 1.0;
    case "LOW_PERFORMANCE":
      return 0.9;
  }
}

function commissionAdjustmentFromBadge(badge: StorePerformanceBadge): number {
  switch (badge) {
    case "ELITE":
      return -0.5;
    case "RELIABLE":
      return 0;
    case "STANDARD":
      return 0;
    case "LOW_PERFORMANCE":
      return 1;
  }
}

function toPerformance(totalOrders: number, lateOrders: number): StorePrepPerformance {
  const onTimeOrders = totalOrders - lateOrders;
  const onTimeRate = totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0;
  const badge = badgeFromOnTimeRate(onTimeRate);

  return {
    totalOrders,
    lateOrders,
    onTimeOrders,
    onTimeRate,
    badge,
    dispatchPriorityMultiplier: dispatchPriorityMultiplierFromBadge(badge),
    suggestedCommissionAdjustment: commissionAdjustmentFromBadge(badge),
  };
}

export async function calculateStorePrepPerformance(
  storeId: string,
): Promise<StorePrepPerformance> {
  const groups = await prisma.orderSellerGroup.findMany({
    where: {
      storeId,
      status: "READY",
      order: {
        isFoodOrder: true,
      },
    },
    select: {
      isLate: true,
    },
  });

  return toPerformance(
    groups.length,
    groups.filter((group) => group.isLate).length,
  );
}

export async function calculateStoresPrepPerformance(
  storeIds: string[],
): Promise<Record<string, StorePrepPerformance>> {
  const ids = Array.from(new Set(storeIds)).filter(Boolean);
  if (ids.length === 0) return {};

  const groups = await prisma.orderSellerGroup.findMany({
    where: {
      storeId: { in: ids },
      status: "READY",
      order: { isFoodOrder: true },
    },
    select: {
      storeId: true,
      isLate: true,
    },
  });

  const counts = new Map<string, { totalOrders: number; lateOrders: number }>();
  for (const id of ids) {
    counts.set(id, { totalOrders: 0, lateOrders: 0 });
  }

  for (const group of groups) {
    const current = counts.get(group.storeId) ?? { totalOrders: 0, lateOrders: 0 };
    current.totalOrders += 1;
    if (group.isLate) current.lateOrders += 1;
    counts.set(group.storeId, current);
  }

  const output: Record<string, StorePrepPerformance> = {};
  for (const id of ids) {
    const current = counts.get(id);
    if (!current) {
      output[id] = DEFAULT_PERFORMANCE;
      continue;
    }
    output[id] = toPerformance(current.totalOrders, current.lateOrders);
  }

  return output;
}
