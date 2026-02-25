import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { autoAssignRider } from "@/lib/rider/logistics";
import { assertValidTransition, normalizeOrderStatus } from "@/lib/order/orderLifecycle";

type Tx = Prisma.TransactionClient;
export type MarkReadySource = "MANUAL" | "AUTO";

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
  source: MarkReadySource = "MANUAL",
): Promise<MarkSellerGroupReadyResult> {
  const group = await tx.orderSellerGroup.findUnique({
    where: { id: sellerGroupId },
    select: {
      id: true,
      orderId: true,
      status: true,
      readyAt: true,
      store: { select: { name: true } },
      order: { select: { isFoodOrder: true, status: true } },
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

  const now = new Date();
  const actualReadyAt = source === "AUTO" ? (group.readyAt ?? now) : now;
  const isLate =
    !!group.readyAt && actualReadyAt.getTime() > group.readyAt.getTime();

  const markReady = await tx.orderSellerGroup.updateMany({
    where: {
      id: sellerGroupId,
      status: "PREPARING",
    },
    data: {
      status: "READY",
      actualReadyAt,
      isLate,
      lateMarkedAt: isLate ? actualReadyAt : null,
    },
  });

  if (markReady.count !== 1) {
    return { updated: false, orderId: group.orderId, reason: "NOT_PREPARING" };
  }

  const normalizedOrderStatus = normalizeOrderStatus(group.order.status);
  if (normalizedOrderStatus !== "READY") {
    assertValidTransition(normalizedOrderStatus, "READY");
  }

  await tx.order.update({
    where: { id: group.orderId },
    data: { status: "READY" },
  });

  if (source === "MANUAL") {
    await tx.job.updateMany({
      where: {
        id: `mark-ready-${sellerGroupId}`,
        type: { in: ["MARK_READY", "MARK_SELLER_GROUP_READY"] },
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
        runAt: now,
        lastError: "Cancelled: manually marked ready by seller",
      },
    });
  }

  await createOrderTimelineIfMissing(
    {
      orderId: group.orderId,
      status: "READY",
      message:
        source === "AUTO"
          ? `Seller ${group.store.name} food is ready for rider pickup.`
          : `Seller ${group.store.name} marked your food as ready for pickup.`,
    },
    tx,
  );

  return { updated: true, orderId: group.orderId, reason: "UPDATED" };
}

export async function markSellerGroupReady(
  sellerGroupId: string,
  source: MarkReadySource = "MANUAL",
): Promise<MarkSellerGroupReadyResult> {
  const result = await prisma.$transaction((tx) =>
    markSellerGroupReadyTx(tx, sellerGroupId, source),
  );

  if (result.updated && result.orderId) {
    await autoAssignRider(result.orderId);
  }

  return result;
}
