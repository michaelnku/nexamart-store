import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/workers/cronLock";
import { addOrderTimelineOnce } from "@/lib/order/timeline";
import { evaluateOrderForDispatch } from "@/lib/order/evaluateOrderForDispatch";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

const LOCK_NAME = "PROCESS_HUB_TIMEOUTS";
const HUB_TIMEOUT_MS = 48 * 60 * 60 * 1000;
const BATCH_SIZE = 20;

export async function processHubTimeouts() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) return { skipped: true, processed: 0 };

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - HUB_TIMEOUT_MS);
    const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

    const timedOutGroups = await prisma.orderSellerGroup.findMany({
      where: {
        status: "IN_TRANSIT_TO_HUB",
        expectedAtHub: { lte: cutoff },
        order: {
          isFoodOrder: false,
          isPaid: true,
          status: { in: ["ACCEPTED", "SHIPPED", "OUT_FOR_DELIVERY"] },
        },
      },
      orderBy: { expectedAtHub: "asc" },
      select: { id: true, orderId: true },
      take: BATCH_SIZE,
    });

    let processed = 0;

    for (const candidate of timedOutGroups) {
      await prisma.$transaction(async (tx) => {
        const group = await tx.orderSellerGroup.findUnique({
          where: { id: candidate.id },
          select: {
            id: true,
            orderId: true,
            sellerId: true,
            status: true,
            subtotal: true,
            shippingFee: true,
            expectedAtHub: true,
            store: { select: { name: true } },
            order: {
              select: {
                id: true,
                userId: true,
                totalAmount: true,
              },
            },
          },
        });

        if (!group) return;
        if (group.status !== "IN_TRANSIT_TO_HUB") return;
        if (!group.expectedAtHub || group.expectedAtHub > cutoff) return;

        await tx.orderSellerGroup.update({
          where: { id: group.id },
          data: { status: "CANCELLED" },
        });

        await addOrderTimelineOnce(
          {
            orderId: group.orderId,
            status: "SHIPPED",
            message: `Shipment from ${group.store.name} did not arrive at the hub in time and has been cancelled.`,
          },
          tx,
        );

        const nextTotal = Math.max(
          0,
          group.order.totalAmount - (group.subtotal + group.shippingFee),
        );

        await tx.order.update({
          where: { id: group.orderId },
          data: { totalAmount: nextTotal },
        });

        const refundReference = `hub-timeout-refund-${group.id}`;
        const buyerWallet = await tx.wallet.upsert({
          where: { userId: group.order.userId },
          update: {},
          create: {
            userId: group.order.userId,
            currency: "USD",
          },
          select: { id: true },
        });

        await createEscrowEntryIdempotent(tx, {
          orderId: group.orderId,
          userId: group.order.userId,
          role: "BUYER",
          entryType: "REFUND",
          amount: group.subtotal,
          status: "RELEASED",
          reference: refundReference,
          metadata: {
            sellerGroupId: group.id,
            reason: "HUB_TIMEOUT",
          },
        });

        await createDoubleEntryLedger(tx, {
          orderId: group.orderId,
          fromWalletId: systemEscrowAccount.walletId,
          toUserId: group.order.userId,
          toWalletId: buyerWallet.id,
          entryType: "REFUND",
          amount: group.subtotal,
          reference: `${refundReference}-ledger`,
        });

        const existingRefundTx = await tx.transaction.findUnique({
          where: { reference: `${refundReference}-tx` },
          select: { id: true },
        });
        if (!existingRefundTx) {
          await tx.transaction.create({
            data: {
              walletId: buyerWallet.id,
              orderId: group.orderId,
              userId: group.order.userId,
              type: "REFUND",
              amount: group.subtotal,
              status: "SUCCESS",
              reference: `${refundReference}-tx`,
              description: "Hub timeout refund",
            },
          });
        }

        await addOrderTimelineOnce(
          {
            orderId: group.orderId,
            status: "SHIPPED",
            message:
              "A refund for missing items has been issued to your wallet.",
          },
          tx,
        );

        if (nextTotal === 0) {
          await tx.order.update({
            where: { id: group.orderId },
            data: { status: "CANCELLED" },
          });

          await addOrderTimelineOnce(
            {
              orderId: group.orderId,
              status: "CANCELLED",
              message:
                "Order cancelled because no items were available for shipment.",
            },
            tx,
          );
        }

        processed += 1;
      });

      await evaluateOrderForDispatch(candidate.orderId);
    }

    return { skipped: false, processed };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
