import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/cronLock";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";

const LOCK_NAME = "RELEASE_ELIGIBLE_SELLER_GROUPS";
const BATCH_SIZE = 20;

export async function releaseEligibleSellerGroups() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) return { skipped: true, processed: 0 };

  try {
    const now = new Date();
    const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

    const groups = await prisma.orderSellerGroup.findMany({
      where: {
        payoutStatus: "PENDING",
        payoutLocked: false,
        payoutEligibleAt: { lte: now },
        order: {
          isPaid: true,
          status: "DELIVERED",
          payoutReleased: false,
        },
      },
      orderBy: { payoutEligibleAt: "asc" },
      select: { id: true },
      take: BATCH_SIZE,
    });

    let processed = 0;

    for (const candidate of groups) {
      await prisma.$transaction(async (tx) => {
        const lockAttempt = await tx.orderSellerGroup.updateMany({
          where: {
            id: candidate.id,
            payoutStatus: "PENDING",
            payoutLocked: false,
          },
          data: { payoutLocked: true },
        });
        if (lockAttempt.count !== 1) return;

        const group = await tx.orderSellerGroup.findUnique({
          where: { id: candidate.id },
          include: {
            order: {
              select: {
                id: true,
                isPaid: true,
                status: true,
                disputeRaised: true,
                payoutReleased: true,
              },
            },
          },
        });

        if (!group) return;

        if (
          group.payoutStatus === "COMPLETED" ||
          group.order.payoutReleased ||
          !group.order.isPaid ||
          group.order.status !== "DELIVERED"
        ) {
          await tx.orderSellerGroup.update({
            where: { id: group.id },
            data: { payoutLocked: false },
          });
          return;
        }

        if (group.order.disputeRaised) {
          await tx.orderSellerGroup.update({
            where: { id: group.id },
            data: { payoutLocked: false },
          });
          return;
        }

        const payoutTxRef = `tx-seller-payout-${group.id}`;
        const existingPayoutTx = await tx.transaction.findUnique({
          where: { reference: payoutTxRef },
          select: { id: true },
        });

        const sellerWallet = await tx.wallet.upsert({
          where: { userId: group.sellerId },
          update: {},
          create: { userId: group.sellerId },
          select: { id: true },
        });

        if (!existingPayoutTx) {
          await createDoubleEntryLedger(tx, {
            orderId: group.orderId,
            fromWalletId: systemEscrowAccount.walletId,
            toUserId: group.sellerId,
            toWalletId: sellerWallet.id,
            entryType: "SELLER_PAYOUT",
            amount: group.subtotal,
            reference: `seller-payout-group-${group.id}`,
          });

          await tx.transaction.create({
            data: {
              walletId: sellerWallet.id,
              userId: group.sellerId,
              orderId: group.orderId,
              type: "SELLER_PAYOUT",
              status: "SUCCESS",
              amount: group.subtotal,
              reference: payoutTxRef,
              description: `Group-level seller payout release for ${group.id}`,
            },
          });
        }

        const heldRef = `seller-held-${group.id}`;
        const heldEntry = await tx.escrowLedger.findUnique({
          where: { reference: heldRef },
          select: { id: true, status: true },
        });

        if (heldEntry && heldEntry.status !== "RELEASED") {
          await tx.escrowLedger.update({
            where: { reference: heldRef },
            data: { status: "RELEASED" },
          });
        }

        await createEscrowEntryIdempotent(tx, {
          orderId: group.orderId,
          userId: group.sellerId,
          role: "SELLER",
          entryType: "RELEASE",
          amount: group.subtotal,
          status: "RELEASED",
          reference: `seller-group-release-${group.id}`,
          metadata: { sellerGroupId: group.id },
        });

        await tx.orderSellerGroup.update({
          where: { id: group.id },
          data: {
            payoutStatus: "COMPLETED",
            payoutReleasedAt: now,
            payoutLocked: false,
          },
        });

        processed += 1;
      });
    }

    return { skipped: false, processed };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
