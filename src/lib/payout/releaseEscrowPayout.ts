import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import {
  releaseSellerGroupPayoutInTx,
  syncOrderPayoutReleasedStateInTx,
} from "@/lib/payout/sellerPayouts";
import { ServiceContext } from "@/lib/system/serviceContext";

type ReleaseResult =
  | { success: true; processedGroups: number }
  | { skipped: true; reason: string };

type ReleaseEscrowOptions = {
  allowDisputedOrder?: boolean;
  targetSellerGroupIds?: string[];
  markOrderCompleted?: boolean;
  context?: ServiceContext;
};

async function releaseEscrowPayoutWithTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      isPaid: true,
      status: true,
      disputeId: true,
      payoutReleased: true,
      sellerGroups: {
        select: {
          id: true,
          payoutLocked: true,
          payoutReleasedAt: true,
          payoutStatus: true,
        },
      },
    },
  });

  if (!order) return { skipped: true, reason: "ORDER_NOT_FOUND" };
  if (!order.isPaid) return { skipped: true, reason: "ORDER_NOT_PAID" };
  if (
    order.status !== "DELIVERED" &&
    !(options.allowDisputedOrder && order.status === "DISPUTED")
  ) {
    return { skipped: true, reason: "ORDER_NOT_DELIVERED" };
  }

  if (order.payoutReleased) {
    return { skipped: true, reason: "PAYOUT_ALREADY_RELEASED" };
  }

  /** NEW DISPUTE SAFETY */
  if (order.disputeId && !options.allowDisputedOrder) {
    return { skipped: true, reason: "ACTIVE_DISPUTE_LOCKED" };
  }

  /** Prevent race condition if any seller group locked */
  const lockedGroup = order.sellerGroups.find((g) => g.payoutLocked);
  if (lockedGroup && !options.allowDisputedOrder) {
    return { skipped: true, reason: "SELLER_GROUP_LOCKED" };
  }

  const targetGroupIds = options.targetSellerGroupIds?.length
    ? order.sellerGroups
        .filter((group) => options.targetSellerGroupIds?.includes(group.id))
        .map((group) => group.id)
    : order.sellerGroups.map((group) => group.id);

  if (!targetGroupIds.length) {
    return { skipped: true, reason: "NO_TARGET_GROUPS" };
  }

  const systemEscrowAccount = await getOrCreateSystemEscrowAccount();
  let processedGroups = 0;

  for (const groupId of targetGroupIds) {
    const released = await releaseSellerGroupPayoutInTx(
      tx,
      groupId,
      systemEscrowAccount,
      {
        allowDisputedOrder: options.allowDisputedOrder,
        context: options.context,
      },
    );

    if ("success" in released) {
      processedGroups += 1;
    }
  }

  await syncOrderPayoutReleasedStateInTx(tx, orderId);

  const allTargetGroupsFinalized = order.sellerGroups
    .filter((group) => targetGroupIds.includes(group.id))
    .every(
      (group) =>
        group.payoutStatus === "COMPLETED" ||
        group.payoutStatus === "CANCELLED" ||
        Boolean(group.payoutReleasedAt),
    );

  if (options.markOrderCompleted !== false && processedGroups > 0) {
    await tx.order.updateMany({
      where: { id: orderId, status: "DELIVERED" },
      data: { status: "COMPLETED" },
    });
  }

  if (processedGroups === 0) {
    return {
      skipped: true,
      reason: allTargetGroupsFinalized
        ? "PAYOUT_ALREADY_RELEASED"
        : "NO_GROUPS_RELEASED",
    };
  }

  return { success: true, processedGroups };
}

export async function releaseEscrowPayout(
  orderId: string,
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  return prisma.$transaction((tx) => releaseEscrowPayoutWithTx(tx, orderId, options));
}

export async function releaseEscrowPayoutInTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  return releaseEscrowPayoutWithTx(tx, orderId, options);
}
