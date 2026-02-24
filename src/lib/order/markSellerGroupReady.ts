import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { autoAssignRider } from "@/lib/rider/logistics";

type Tx = Prisma.TransactionClient;

type MarkReadyReason =
  | "UPDATED"
  | "ALREADY_READY"
  | "NOT_PREPARING"
  | "NOT_FOOD_ORDER"
  | "NOT_FOUND";

export type MarkSellerGroupReadyResult = {
  updated: boolean;
  orderId: string | null;
  reason: MarkReadyReason;
};

export async function markSellerGroupReadyTx(
  tx: Tx,
  sellerGroupId: string,
): Promise<MarkSellerGroupReadyResult> {
  const group = await tx.orderSellerGroup.findUnique({
    where: { id: sellerGroupId },
    select: {
      id: true,
      orderId: true,
      status: true,
      store: { select: { name: true } },
      order: { select: { isFoodOrder: true } },
    },
  });

  if (!group) {
    return { updated: false, orderId: null, reason: "NOT_FOUND" };
  }

  if (!group.order.isFoodOrder) {
    return { updated: false, orderId: group.orderId, reason: "NOT_FOOD_ORDER" };
  }

  if (group.status === "READY") {
    return { updated: false, orderId: group.orderId, reason: "ALREADY_READY" };
  }

  const markReady = await tx.orderSellerGroup.updateMany({
    where: {
      id: sellerGroupId,
      status: "PREPARING",
    },
    data: {
      status: "READY",
      readyAt: new Date(),
    },
  });

  if (markReady.count !== 1) {
    return { updated: false, orderId: group.orderId, reason: "NOT_PREPARING" };
  }

  await createOrderTimelineIfMissing(
    {
      orderId: group.orderId,
      status: "SHIPPED",
      message: `Seller ${group.store.name} marked your food as ready for pickup.`,
    },
    tx,
  );

  return { updated: true, orderId: group.orderId, reason: "UPDATED" };
}

export async function markSellerGroupReady(
  sellerGroupId: string,
): Promise<MarkSellerGroupReadyResult> {
  const result = await prisma.$transaction((tx) =>
    markSellerGroupReadyTx(tx, sellerGroupId),
  );

  if (result.updated && result.orderId) {
    await autoAssignRider(result.orderId);
  }

  return result;
}
