import { Prisma } from "@/generated/prisma";
import {
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
  ReturnStatus,
} from "@/generated/prisma/client";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { creditBuyerWalletRefundInTx } from "@/lib/refunds/creditBuyerWalletRefund";
import {
  getDisputePolicy,
  isTerminalDisputeStatus,
} from "@/lib/disputes/policy";

type Tx = Prisma.TransactionClient;

export type SellerGroupImpactInput = {
  sellerGroupId: string;
  refundAmount: number;
};

export type OrderDisputeContext = {
  id: string;
  userId: string;
  isFoodOrder: boolean;
  totalAmount: number;
  shippingFee: number;
  status: string;
  disputeId: string | null;
  delivery: {
    id: string;
    riderId: string | null;
    deliveredAt: Date | null;
    payoutLocked: boolean;
    payoutReleasedAt: Date | null;
  } | null;
  sellerGroups: Array<{
    id: string;
    sellerId: string;
    subtotal: number;
    shippingFee: number;
    sellerRevenue: number;
    platformCommission: number;
    payoutLocked: boolean;
    payoutStatus: string;
  }>;
  dispute: {
    id: string;
    status: DisputeStatus;
    reason: DisputeReason;
    resolution: DisputeResolution | null;
    refundAmount: number | null;
    returnRequest: {
      id: string;
      status: ReturnStatus;
      trackingNumber: string | null;
      carrier: string | null;
      shippedAt: Date | null;
      receivedAt: Date | null;
    } | null;
    disputeSellerGroupImpacts: Array<{
      id: string;
      sellerGroupId: string;
      refundAmount: number;
    }>;
  } | null;
};

type BuyerRefundInput = {
  disputeId: string;
  orderId: string;
  buyerUserId: string;
  amount: number;
  referenceSuffix: string;
};

export async function getOrderDisputeContext(
  tx: Tx,
  orderId: string,
): Promise<OrderDisputeContext | null> {
  return tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      isFoodOrder: true,
      totalAmount: true,
      shippingFee: true,
      status: true,
      disputeId: true,
      delivery: {
        select: {
          id: true,
          riderId: true,
          deliveredAt: true,
          payoutLocked: true,
          payoutReleasedAt: true,
        },
      },
      sellerGroups: {
        select: {
          id: true,
          sellerId: true,
          subtotal: true,
          shippingFee: true,
          sellerRevenue: true,
          platformCommission: true,
          payoutLocked: true,
          payoutStatus: true,
        },
      },
      dispute: {
        select: {
          id: true,
          status: true,
          reason: true,
          resolution: true,
          refundAmount: true,
          returnRequest: {
            select: {
              id: true,
              status: true,
              trackingNumber: true,
              carrier: true,
              shippedAt: true,
              receivedAt: true,
            },
          },
          disputeSellerGroupImpacts: {
            select: {
              id: true,
              sellerGroupId: true,
              refundAmount: true,
            },
          },
        },
      },
    },
  });
}

export function ensureDisputeCanBeOpened(
  order: OrderDisputeContext,
  actorUserId: string,
  reason: DisputeReason,
): void {
  if (order.userId !== actorUserId) {
    throw new Error("Forbidden");
  }

  if (order.status !== "DELIVERED") {
    throw new Error("Order must be delivered before opening a dispute");
  }

  if (!order.delivery?.deliveredAt) {
    throw new Error("Missing delivery confirmation timestamp");
  }

  if (order.disputeId || order.dispute) {
    throw new Error("A dispute already exists for this order");
  }

  const policy = getDisputePolicy(order.isFoodOrder, reason);
  const disputeExpiresAt = new Date(
    order.delivery.deliveredAt.getTime() + policy.disputeWindowMs,
  );

  if (Date.now() > disputeExpiresAt.getTime()) {
    throw new Error("Dispute window expired");
  }
}

export function ensureActiveDispute(
  order: OrderDisputeContext,
): NonNullable<OrderDisputeContext["dispute"]> {
  if (
    !order.dispute ||
    !order.disputeId ||
    order.dispute.id !== order.disputeId ||
    isTerminalDisputeStatus(order.dispute.status)
  ) {
    throw new Error("No active dispute found");
  }

  return order.dispute;
}

export function resolveImpactedSellerGroupIds(
  order: OrderDisputeContext,
  requestedGroupIds?: string[],
): string[] {
  if (!requestedGroupIds?.length) {
    return order.sellerGroups.map((group) => group.id);
  }

  const validIds = new Set(order.sellerGroups.map((group) => group.id));
  const uniqueIds = Array.from(new Set(requestedGroupIds));

  for (const groupId of uniqueIds) {
    if (!validIds.has(groupId)) {
      throw new Error(`Invalid seller group: ${groupId}`);
    }
  }

  return uniqueIds;
}

export async function replaceDisputeSellerGroupImpacts(
  tx: Tx,
  disputeId: string,
  sellerGroupIds: string[],
  refundAmounts?: Map<string, number>,
): Promise<void> {
  await tx.disputeSellerGroupImpact.deleteMany({
    where: { disputeId },
  });

  if (!sellerGroupIds.length) {
    return;
  }

  await tx.disputeSellerGroupImpact.createMany({
    data: sellerGroupIds.map((sellerGroupId) => ({
      disputeId,
      sellerGroupId,
      refundAmount: refundAmounts?.get(sellerGroupId) ?? 0,
    })),
  });
}

export async function setDisputePayoutLocks(
  tx: Tx,
  input: {
    orderId: string;
    sellerGroupIds: string[];
    locked: boolean;
    lockRider: boolean;
  },
): Promise<void> {
  if (input.sellerGroupIds.length > 0) {
    await tx.orderSellerGroup.updateMany({
      where: { id: { in: input.sellerGroupIds } },
      data: { payoutLocked: input.locked },
    });
  }

  if (input.lockRider) {
    await tx.delivery.updateMany({
      where: { orderId: input.orderId },
      data: { payoutLocked: input.locked },
    });
  }
}

export async function createAdminNotifications(
  tx: Tx,
  title: string,
  message: string,
): Promise<void> {
  const admins = await tx.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!admins.length) {
    return;
  }

  await tx.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title,
      message,
    })),
  });
}

export async function createUserNotification(
  tx: Tx,
  userId: string,
  title: string,
  message: string,
): Promise<void> {
  await tx.notification.create({
    data: {
      userId,
      title,
      message,
    },
  });
}

function normalizePositiveAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  return Number(amount.toFixed(2));
}

export async function creditBuyerRefundInTx(
  tx: Tx,
  input: BuyerRefundInput,
): Promise<void> {
  await creditBuyerWalletRefundInTx(tx, {
    orderId: input.orderId,
    buyerUserId: input.buyerUserId,
    amount: input.amount,
    reference: `dispute-refund-${input.disputeId}-${input.referenceSuffix}`,
    description: `Dispute refund for order ${input.orderId}`,
  });
}

function buildImpactMap(impacts: SellerGroupImpactInput[]): Map<string, number> {
  return impacts.reduce((map, impact) => {
    map.set(impact.sellerGroupId, normalizePositiveAmount(impact.refundAmount));
    return map;
  }, new Map<string, number>());
}

export function normalizeSellerGroupRefundImpacts(
  order: OrderDisputeContext,
  refundAmount: number,
  providedImpacts?: SellerGroupImpactInput[],
): Map<string, number> {
  const amount = normalizePositiveAmount(refundAmount);

  if (providedImpacts?.length) {
    const impactMap = buildImpactMap(providedImpacts);
    const validIds = new Set(order.sellerGroups.map((group) => group.id));

    let total = 0;
    for (const [groupId, value] of impactMap.entries()) {
      if (!validIds.has(groupId)) {
        throw new Error(`Invalid seller group impact: ${groupId}`);
      }

      total += value;
    }

    if (Math.abs(total - amount) > 0.01) {
      throw new Error("Seller group refund allocations must equal the refund amount");
    }

    return impactMap;
  }

  const candidateGroups = order.dispute?.disputeSellerGroupImpacts.length
    ? order.dispute.disputeSellerGroupImpacts
        .map((impact) =>
          order.sellerGroups.find((group) => group.id === impact.sellerGroupId),
        )
        .filter(
          (
            group,
          ): group is OrderDisputeContext["sellerGroups"][number] => Boolean(group),
        )
    : order.sellerGroups;

  const totalPool = candidateGroups.reduce(
    (sum, group) => sum + Math.max(0, group.sellerRevenue + group.platformCommission),
    0,
  );

  if (totalPool <= 0) {
    throw new Error("No seller payout pool is available for refund adjustment");
  }

  const impactMap = new Map<string, number>();
  let distributed = 0;

  candidateGroups.forEach((group, index) => {
    const pool = Math.max(0, group.sellerRevenue + group.platformCommission);
    const nextValue =
      index === candidateGroups.length - 1
        ? Number((amount - distributed).toFixed(2))
        : Number(((amount * pool) / totalPool).toFixed(2));

    impactMap.set(group.id, nextValue);
    distributed += nextValue;
  });

  return impactMap;
}

export async function applyRefundImpactToSellerGroups(
  tx: Tx,
  order: OrderDisputeContext,
  impacts: Map<string, number>,
): Promise<string[]> {
  const fullyRefundedGroupIds: string[] = [];

  for (const group of order.sellerGroups) {
    const refundAmount = impacts.get(group.id);

    if (!refundAmount || refundAmount <= 0) {
      continue;
    }

    const payoutPool = Math.max(0, group.sellerRevenue + group.platformCommission);
    if (payoutPool <= 0) {
      continue;
    }

    const cappedRefund = Math.min(payoutPool, refundAmount);
    const ratio = Math.min(1, cappedRefund / payoutPool);
    const nextSellerRevenue = Math.max(
      0,
      Number((group.sellerRevenue * (1 - ratio)).toFixed(2)),
    );
    const nextPlatformCommission = Math.max(
      0,
      Number((group.platformCommission * (1 - ratio)).toFixed(2)),
    );
    const fullyRefunded = nextSellerRevenue <= 0.01 && nextPlatformCommission <= 0.01;

    if (fullyRefunded) {
      fullyRefundedGroupIds.push(group.id);
    }

    await tx.orderSellerGroup.update({
      where: { id: group.id },
      data: {
        sellerRevenue: nextSellerRevenue,
        platformCommission: nextPlatformCommission,
        payoutLocked: fullyRefunded,
        ...(fullyRefunded ? { payoutStatus: "CANCELLED" as const } : {}),
      },
    });
  }

  return fullyRefundedGroupIds;
}

export function getDisputeRefundCeiling(
  order: OrderDisputeContext,
  sellerGroupIds?: string[],
): number {
  if (!sellerGroupIds?.length) {
    return order.totalAmount;
  }

  const targetedGroups = order.sellerGroups.filter((group) =>
    sellerGroupIds.includes(group.id),
  );

  return targetedGroups.reduce(
    (sum, group) => sum + group.subtotal + Math.max(0, group.shippingFee),
    0,
  );
}

export function isWholeOrderDispute(
  order: OrderDisputeContext,
  sellerGroupIds: string[],
): boolean {
  return sellerGroupIds.length === order.sellerGroups.length;
}

export async function openReturnRequestInTx(
  tx: Tx,
  disputeId: string,
): Promise<void> {
  await tx.returnRequest.upsert({
    where: { disputeId },
    update: {
      status: "PENDING",
    },
    create: {
      disputeId,
      status: "PENDING",
    },
  });
}

export async function createDisputeTimelineAndNotification(
  tx: Tx,
  input: {
    orderId: string;
    userId: string;
    title: string;
    message: string;
    status: "DISPUTED" | "RETURN_REQUESTED" | "RETURNED" | "COMPLETED" | "REFUNDED";
  },
): Promise<void> {
  await createOrderTimelineIfMissing(
    {
      orderId: input.orderId,
      status: input.status,
      message: input.message,
    },
    tx,
  );

  await createUserNotification(tx, input.userId, input.title, input.message);
}
