import { Prisma } from "@/generated/prisma";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { settlePendingPayoutTransaction } from "@/lib/payout/pendingPayoutTransactions";
import { isDeliveryRiderPayoutPending } from "@/lib/payout/riderPayouts";
import { ServiceContext } from "@/lib/system/serviceContext";

type Tx = Prisma.TransactionClient;

type SystemEscrowAccount = {
  userId: string;
  walletId: string;
};

type ReleaseSellerGroupOptions = {
  allowDisputedOrder?: boolean;
  assumeLocked?: boolean;
  now?: Date;
  context?: ServiceContext;
};

type SellerGroupReleaseResult =
  | { success: true; orderId: string }
  | { skipped: true; reason: string; orderId?: string };

type SellerGroupPayoutRecord = {
  id: string;
  orderId: string;
  sellerId: string;
  payoutLocked: boolean;
  payoutStatus: string;
  payoutReleasedAt: Date | null;
  sellerRevenue: number;
  platformCommission: number;
  subtotal: number;
  order: {
    id: string;
    isPaid: boolean;
    status: string;
    disputeId: string | null;
  };
};

async function loadSellerGroup(
  tx: Tx,
  groupId: string,
): Promise<SellerGroupPayoutRecord | null> {
  return tx.orderSellerGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      orderId: true,
      sellerId: true,
      payoutLocked: true,
      payoutStatus: true,
      payoutReleasedAt: true,
      sellerRevenue: true,
      platformCommission: true,
      subtotal: true,
      order: {
        select: {
          id: true,
          isPaid: true,
          status: true,
          disputeId: true,
        },
      },
    },
  });
}

async function unlockSellerGroupIfNeeded(
  tx: Tx,
  groupId: string,
  shouldUnlock: boolean,
) {
  if (!shouldUnlock) {
    return;
  }

  await tx.orderSellerGroup.update({
    where: { id: groupId },
    data: { payoutLocked: false },
  });
}

async function markEscrowEntryReleased(
  tx: Tx,
  reference: string,
  fallback: Omit<Parameters<typeof createEscrowEntryIdempotent>[1], "status">,
) {
  const existing = await tx.escrowLedger.findUnique({
    where: { reference },
    select: { id: true, status: true },
  });

  if (existing) {
    if (existing.status !== "RELEASED") {
      await tx.escrowLedger.update({
        where: { reference },
        data: { status: "RELEASED" },
      });
    }
    return;
  }

  await createEscrowEntryIdempotent(tx, {
    ...fallback,
    status: "RELEASED",
  });
}

export async function syncOrderPayoutReleasedStateInTx(
  tx: Tx,
  orderId: string,
): Promise<void> {
  const [remainingSellerGroups, delivery] = await Promise.all([
    tx.orderSellerGroup.count({
      where: {
        orderId,
        payoutStatus: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    tx.delivery.findFirst({
      where: { orderId },
      select: {
        riderId: true,
        riderPayoutAmount: true,
        payoutReleasedAt: true,
      },
    }),
  ]);

  const riderPayoutPending = isDeliveryRiderPayoutPending(delivery);

  await tx.order.update({
    where: { id: orderId },
    data: {
      payoutReleased: remainingSellerGroups === 0 && !riderPayoutPending,
    },
  });
}

export async function releaseSellerGroupPayoutInTx(
  tx: Tx,
  groupId: string,
  systemEscrowAccount: SystemEscrowAccount,
  options: ReleaseSellerGroupOptions = {},
): Promise<SellerGroupReleaseResult> {
  const now = options.now ?? new Date();
  const shouldUnlockOnExit = !options.assumeLocked;

  if (!options.assumeLocked) {
    const lockAttempt = await tx.orderSellerGroup.updateMany({
      where: {
        id: groupId,
        payoutStatus: "PENDING",
        payoutReleasedAt: null,
        payoutLocked: false,
      },
      data: { payoutLocked: true },
    });

    if (lockAttempt.count !== 1) {
      return { skipped: true, reason: "GROUP_LOCK_UNAVAILABLE" };
    }
  }

  const group = await loadSellerGroup(tx, groupId);

  if (!group) {
    return { skipped: true, reason: "GROUP_NOT_FOUND" };
  }

  if (!group.order.isPaid) {
    await unlockSellerGroupIfNeeded(tx, group.id, shouldUnlockOnExit);
    return { skipped: true, reason: "ORDER_NOT_PAID", orderId: group.orderId };
  }

  if (
    group.order.status !== "DELIVERED" &&
    !(options.allowDisputedOrder && group.order.status === "DISPUTED")
  ) {
    await unlockSellerGroupIfNeeded(tx, group.id, shouldUnlockOnExit);
    return {
      skipped: true,
      reason: "ORDER_NOT_DELIVERED",
      orderId: group.orderId,
    };
  }

  if (group.order.disputeId && !options.allowDisputedOrder) {
    await unlockSellerGroupIfNeeded(tx, group.id, shouldUnlockOnExit);
    return {
      skipped: true,
      reason: "ACTIVE_DISPUTE_LOCKED",
      orderId: group.orderId,
    };
  }

  if (
    group.payoutStatus === "COMPLETED" ||
    group.payoutReleasedAt ||
    group.payoutStatus === "CANCELLED"
  ) {
    await unlockSellerGroupIfNeeded(tx, group.id, shouldUnlockOnExit);
    return {
      skipped: true,
      reason: "GROUP_ALREADY_FINALIZED",
      orderId: group.orderId,
    };
  }

  const sellerAmount = Math.max(0, group.sellerRevenue);
  const platformFee = Math.max(0, group.platformCommission);
  const sellerWallet = await tx.wallet.upsert({
    where: { userId: group.sellerId },
    update: {},
    create: { userId: group.sellerId },
    select: { id: true },
  });

  if (sellerAmount > 0) {
    await markEscrowEntryReleased(tx, `seller-held-${group.id}`, {
      orderId: group.orderId,
      userId: group.sellerId,
      role: "SELLER",
      entryType: "SELLER_EARNING",
      amount: sellerAmount,
      reference: `seller-held-${group.id}`,
      metadata: { sellerGroupId: group.id, backfilled: true },
      context: options.context,
    });
  }

  if (platformFee > 0) {
    await markEscrowEntryReleased(tx, `platform-held-${group.id}`, {
      orderId: group.orderId,
      role: "PLATFORM",
      entryType: "PLATFORM_COMMISSION",
      amount: platformFee,
      reference: `platform-held-${group.id}`,
      metadata: { sellerGroupId: group.id, backfilled: true },
      context: options.context,
    });
  }

  if (sellerAmount > 0) {
    await createEscrowEntryIdempotent(tx, {
      orderId: group.orderId,
      userId: group.sellerId,
      role: "SELLER",
      entryType: "RELEASE",
      amount: sellerAmount,
      status: "RELEASED",
      reference: `seller-payout-release-${group.id}`,
      metadata: { sellerGroupId: group.id },
      context: options.context,
    });
  }

  if (platformFee > 0) {
    await createEscrowEntryIdempotent(tx, {
      orderId: group.orderId,
      role: "PLATFORM",
      entryType: "PLATFORM_COMMISSION",
      amount: platformFee,
      status: "RELEASED",
      reference: `platform-fee-${group.id}`,
      metadata: { sellerGroupId: group.id },
      context: options.context,
    });
  }

  if (sellerAmount + platformFee > 0) {
    await createEscrowEntryIdempotent(tx, {
      orderId: group.orderId,
      role: "PLATFORM",
      entryType: "RELEASE",
      amount: sellerAmount + platformFee,
      status: "RELEASED",
      reference: `escrow-release-${group.id}`,
      metadata: { sellerGroupId: group.id },
      context: options.context,
    });
  }

  if (platformFee > 0) {
    await createDoubleEntryLedger(tx, {
      orderId: group.orderId,
      fromUserId: systemEscrowAccount.userId,
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: systemEscrowAccount.userId,
      toWalletId: systemEscrowAccount.walletId,
      entryType: "PLATFORM_FEE",
      amount: platformFee,
      reference: `platform-accounting-${group.id}`,
      fromAccountType: "ESCROW",
      toAccountType: "PLATFORM",
      debitBalanceAccountType: "ESCROW",
      resolveFromWallet: false,
      resolveToWallet: false,
      context: options.context,
    });
  }

  if (sellerAmount > 0) {
    await createDoubleEntryLedger(tx, {
      orderId: group.orderId,
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: group.sellerId,
      toWalletId: sellerWallet.id,
      entryType: "SELLER_PAYOUT",
      amount: sellerAmount,
      reference: `seller-payout-${group.id}`,
      fromAccountType: "ESCROW",
      toAccountType: "ESCROW",
      debitBalanceAccountType: "ESCROW",
      context: options.context,
    });
  }

  await settlePendingPayoutTransaction(tx, {
    reference: `pending-seller-${group.id}`,
    walletUserId: group.sellerId,
    orderId: group.orderId,
    type: "SELLER_PAYOUT",
    amount: sellerAmount,
    status: sellerAmount > 0 ? "SUCCESS" : "CANCELLED",
    description:
      sellerAmount > 0
        ? `Escrow payout released for seller group ${group.id}`
        : `Seller payout cancelled for seller group ${group.id}`,
  });

  await tx.orderSellerGroup.update({
    where: { id: group.id },
    data: {
      payoutStatus: sellerAmount > 0 ? "COMPLETED" : "CANCELLED",
      payoutReleasedAt: sellerAmount > 0 ? now : group.payoutReleasedAt,
      payoutLocked: false,
    },
  });

  await syncOrderPayoutReleasedStateInTx(tx, group.orderId);

  return { success: true, orderId: group.orderId };
}
