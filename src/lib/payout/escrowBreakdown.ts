import { getCommissionRate } from "@/lib/payout/commission";

type SellerGroupLike = {
  sellerId: string;
  subtotal: number;
  store: {
    type: "GENERAL" | "FOOD";
  };
};

export function buildSellerNetByUser(
  sellerGroups: SellerGroupLike[],
): Map<string, number> {
  const sellerNetByUserId = new Map<string, number>();

  for (const group of sellerGroups) {
    const commissionRate = getCommissionRate(group.store.type);
    const platformCommission = group.subtotal * commissionRate;
    const sellerNet = group.subtotal - platformCommission;

    const current = sellerNetByUserId.get(group.sellerId) ?? 0;
    sellerNetByUserId.set(group.sellerId, current + sellerNet);
  }

  return sellerNetByUserId;
}
