import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/cronLock";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { Prisma } from "@/generated/prisma";

const LOCK_NAME = "RELEASE_ELIGIBLE_RIDER_PAYOUTS";
const BATCH_SIZE = 20;

async function processRiderDeliveryPayout(
  tx: Prisma.TransactionClient,
  deliveryId: string,
  now: Date,
): Promise<boolean> {
  const lockAttempt = await tx.delivery.updateMany({
    where: {
      id: deliveryId,
      status: "DELIVERED",
      payoutReleasedAt: null,
      payoutLocked: false,
    },
    data: { payoutLocked: true },
  });
  if (lockAttempt.count !== 1) return false;

  const delivery = await tx.delivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      orderId: true,
      riderId: true,
      fee: true,
      payoutReleasedAt: true,
      order: {
        select: {
          id: true,
          disputeRaised: true,
          isPaid: true,
        },
      },
    },
  });

  if (!delivery || !delivery.riderId) return false;

  if (delivery.payoutReleasedAt || !delivery.order.isPaid) {
    await tx.delivery.update({
      where: { id: deliveryId },
      data: { payoutLocked: false },
    });
    return false;
  }

  if (delivery.order.disputeRaised) {
    await tx.delivery.update({
      where: { id: deliveryId },
      data: { payoutLocked: false },
    });
    return false;
  }

  // Backward-compatible idempotency:
  // old flows may already have credited rider with an EARNING transaction.
  const existingPayout = await tx.transaction.findFirst({
    where: {
      orderId: delivery.orderId,
      userId: delivery.riderId,
      type: "EARNING",
    },
    select: { id: true },
  });

  if (!existingPayout) {
    const riderWallet = await tx.wallet.upsert({
      where: { userId: delivery.riderId },
      update: {},
      create: { userId: delivery.riderId },
      select: { id: true },
    });

    await tx.wallet.update({
      where: { id: riderWallet.id },
      data: {
        pending: { decrement: delivery.fee },
        totalEarnings: { increment: delivery.fee },
      },
    });

    await tx.transaction.create({
      data: {
        walletId: riderWallet.id,
        userId: delivery.riderId,
        orderId: delivery.orderId,
        type: "EARNING",
        status: "SUCCESS",
        amount: delivery.fee,
        reference: `tx-rider-payout-${delivery.id}`,
        description: `Delayed rider payout release for delivery ${delivery.id}`,
      },
    });

    await createDoubleEntryLedger(tx, {
      orderId: delivery.orderId,
      toUserId: delivery.riderId,
      toWalletId: riderWallet.id,
      entryType: "RIDER_PAYOUT",
      amount: delivery.fee,
      reference: `ledger-rider-payout-${delivery.id}`,
      resolveFromWallet: false,
      resolveToWallet: false,
    });
  }

  await tx.escrowLedger.updateMany({
    where: {
      orderId: delivery.orderId,
      userId: delivery.riderId,
      role: "RIDER",
      entryType: "RIDER_EARNING",
      status: "HELD",
    },
    data: { status: "RELEASED" },
  });

  await tx.delivery.update({
    where: { id: delivery.id },
    data: {
      payoutReleasedAt: now,
      payoutLocked: false,
    },
  });

  const remainingSeller = await tx.orderSellerGroup.count({
    where: {
      orderId: delivery.orderId,
      payoutStatus: { not: "COMPLETED" },
    },
  });

  if (remainingSeller === 0) {
    await tx.order.update({
      where: { id: delivery.orderId },
      data: { payoutReleased: true },
    });
  }

  return true;
}

export async function releaseEligibleRiderPayouts() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) return { skipped: true, processed: 0 };

  try {
    const now = new Date();
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: "DELIVERED",
        payoutEligibleAt: { lte: now },
        payoutReleasedAt: null,
        payoutLocked: false,
        riderId: { not: null },
        order: {
          isPaid: true,
        },
      },
      orderBy: { payoutEligibleAt: "asc" },
      select: { id: true },
      take: BATCH_SIZE,
    });

    let processed = 0;

    for (const candidate of deliveries) {
      await prisma.$transaction(async (tx) => {
        const released = await processRiderDeliveryPayout(tx, candidate.id, now);
        if (released) processed += 1;
      });
    }

    return { skipped: false, processed };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}

export async function releaseEligibleRiderPayoutForOrder(orderId: string) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findFirst({
      where: {
        orderId,
        status: "DELIVERED",
        payoutReleasedAt: null,
        payoutLocked: false,
        payoutEligibleAt: { lte: now },
        riderId: { not: null },
      },
      select: { id: true },
    });

    if (!delivery) return { skipped: true };
    const released = await processRiderDeliveryPayout(tx, delivery.id, now);
    return { skipped: !released };
  });
}
