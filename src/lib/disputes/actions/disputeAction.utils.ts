import type { OrderDisputeContext } from "@/lib/disputes/disputeService";

export function buildFullRefundImpactMap(
  order: OrderDisputeContext,
  impactedGroupIds: string[],
): Map<string, number> {
  const groups = order.sellerGroups.filter((group) =>
    impactedGroupIds.includes(group.id),
  );

  return new Map(
    groups.map((group) => [
      group.id,
      Number((group.subtotal + Math.max(0, group.shippingFee)).toFixed(2)),
    ]),
  );
}

