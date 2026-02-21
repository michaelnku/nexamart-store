import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { getCommissionRate } from "./commission";

const PLATFORM_COMMISSION_PERCENT = 15;
//const PLATFORM_COMMISSION_PERCENT = getCommissionRate();

type ReleaseResult = { success: true } | { skipped: true; reason: string };

type ReleaseEscrowOptions = {
  allowDisputedOrder?: boolean;
};

function toCommissionAmount(subtotal: number) {
  return (subtotal * PLATFORM_COMMISSION_PERCENT) / 100;
}

function toSellerAmount(subtotal: number) {
  return subtotal - toCommissionAmount(subtotal);
}

async function releaseEscrowPayoutWithTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  systemEscrowAccount: { userId: string; walletId: string },
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      sellerGroups: {
        select: {
          id: true,
          sellerId: true,
          subtotal: true,
        },
      },
      delivery: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!order) return { skipped: true, reason: "ORDER_NOT_FOUND" };
  if (!order.isPaid) return { skipped: true, reason: "ORDER_NOT_PAID" };
  if (order.status !== "DELIVERED") {
    return { skipped: true, reason: "ORDER_NOT_DELIVERED" };
  }
  if (order.payoutReleased) {
    return { skipped: true, reason: "PAYOUT_ALREADY_RELEASED" };
  }
  if (order.disputeRaised && !options.allowDisputedOrder) {
    return { skipped: true, reason: "PAYOUT_SKIPPED_ACTIVE_DISPUTE" };
  }

  const existingRelease = await tx.ledgerEntry.findFirst({
    where: {
      orderId,
      entryType: "SELLER_PAYOUT",
      direction: "CREDIT",
    },
    select: { id: true },
  });
  if (existingRelease) {
    return { skipped: true, reason: "PAYOUT_TRANSACTION_EXISTS" };
  }

  for (const group of order.sellerGroups) {
    const sellerAmount = toSellerAmount(group.subtotal);
    const platformFee = toCommissionAmount(group.subtotal);

    const sellerWallet = await tx.wallet.upsert({
      where: { userId: group.sellerId },
      update: {},
      create: { userId: group.sellerId },
      select: { id: true },
    });

    const heldRef = `seller-held-${group.id}`;
    const heldEntry = await tx.escrowLedger.findUnique({
      where: { reference: heldRef },
      select: { id: true },
    });
    if (heldEntry) {
      await tx.escrowLedger.update({
        where: { reference: heldRef },
        data: { status: "RELEASED" },
      });
    } else {
      await createEscrowEntryIdempotent(tx, {
        orderId,
        userId: group.sellerId,
        role: "SELLER",
        entryType: "SELLER_EARNING",
        amount: group.subtotal,
        status: "RELEASED",
        reference: heldRef,
        metadata: { sellerGroupId: group.id, backfilled: true },
      });
    }

    await createEscrowEntryIdempotent(tx, {
      orderId,
      userId: group.sellerId,
      role: "SELLER",
      entryType: "RELEASE",
      amount: sellerAmount,
      status: "RELEASED",
      reference: `seller-release-${group.id}`,
      metadata: { sellerGroupId: group.id },
    });

    await createEscrowEntryIdempotent(tx, {
      orderId,
      role: "PLATFORM",
      entryType: "PLATFORM_COMMISSION",
      amount: platformFee,
      status: "RELEASED",
      reference: `platform-fee-${group.id}`,
      metadata: { sellerGroupId: group.id },
    });

    await createEscrowEntryIdempotent(tx, {
      orderId,
      role: "PLATFORM",
      entryType: "RELEASE",
      amount: sellerAmount + platformFee,
      status: "RELEASED",
      reference: `escrow-release-${group.id}`,
      metadata: { sellerGroupId: group.id },
    });

    await createDoubleEntryLedger(tx, {
      orderId,
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: group.sellerId,
      toWalletId: sellerWallet.id,
      entryType: "SELLER_PAYOUT",
      amount: sellerAmount,
      reference: `seller-payout-${group.id}`,
    });

    await createDoubleEntryLedger(tx, {
      orderId,
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: systemEscrowAccount.userId,
      entryType: "PLATFORM_FEE",
      amount: platformFee,
      reference: `platform-ledger-fee-${group.id}`,
      resolveToWallet: false,
    });

    await tx.transaction.create({
      data: {
        walletId: sellerWallet.id,
        userId: group.sellerId,
        orderId,
        type: "SELLER_PAYOUT",
        status: "SUCCESS",
        amount: sellerAmount,
        reference: `tx-seller-payout-${group.id}`,
        description: `Escrow release payout for seller group ${group.id}`,
      },
    });
  }

  // Migration safety:
  // Rider payout release is now managed by delivery-level cron
  // `releaseEligibleRiderPayouts` with its own hold and idempotency guard.

  await tx.orderSellerGroup.updateMany({
    where: { orderId },
    data: { payoutStatus: "COMPLETED" },
  });

  await tx.order.update({
    where: { id: orderId },
    data: {
      payoutReleased: true,
      status: "COMPLETED",
    },
  });

  return { success: true };
}

export async function releaseEscrowPayout(
  orderId: string,
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  const systemEscrowAccount = await getOrCreateSystemEscrowAccount();
  return prisma.$transaction((tx) =>
    releaseEscrowPayoutWithTx(tx, orderId, systemEscrowAccount, options),
  );
}

export async function releaseEscrowPayoutInTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  const systemEscrowAccount = await getOrCreateSystemEscrowAccount();
  return releaseEscrowPayoutWithTx(tx, orderId, systemEscrowAccount, options);
}
