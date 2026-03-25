import { Prisma } from "@/generated/prisma";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { TREASURY_LEDGER_ROUTING } from "@/lib/ledger/treasurySubledgers";
import { PlatformTreasuryAccount } from "@/lib/ledger/systemEscrowWallet";
import { settlePendingPayoutTransaction } from "@/lib/payout/pendingPayoutTransactions";
import { syncOrderPayoutReleasedStateInTx } from "@/lib/payout/sellerPayouts";
import { ServiceContext } from "@/lib/system/serviceContext";

type Tx = Prisma.TransactionClient;

type RiderPayoutState = {
  riderId: string | null;
  riderPayoutAmount: number;
  payoutReleasedAt: Date | null;
};

export type RiderPayoutReleaseResult =
  | { success: true; orderId: string; deliveryId: string }
  | { skipped: true; reason: string; orderId?: string; deliveryId?: string };

export function isDeliveryRiderPayoutRequired(
  delivery: RiderPayoutState | null | undefined,
): boolean {
  if (!delivery) {
    return false;
  }

  return Boolean(delivery.riderId) && delivery.riderPayoutAmount > 0;
}

export function isDeliveryRiderPayoutPending(
  delivery: RiderPayoutState | null | undefined,
): boolean {
  if (!delivery || !isDeliveryRiderPayoutRequired(delivery)) {
    return false;
  }

  return !delivery.payoutReleasedAt;
}

export async function releaseRiderDeliveryPayoutInTx(
  tx: Tx,
  deliveryId: string,
  systemEscrowAccount: PlatformTreasuryAccount,
  now: Date,
  context: ServiceContext,
): Promise<RiderPayoutReleaseResult> {
  const lockAttempt = await tx.delivery.updateMany({
    where: {
      id: deliveryId,
      status: "DELIVERED",
      payoutReleasedAt: null,
      payoutLocked: false,
    },
    data: { payoutLocked: true },
  });

  if (lockAttempt.count !== 1) {
    return { skipped: true, reason: "DELIVERY_LOCK_UNAVAILABLE", deliveryId };
  }

  const delivery = await tx.delivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      orderId: true,
      riderId: true,
      riderPayoutAmount: true,
      payoutReleasedAt: true,
      order: {
        select: {
          isPaid: true,
          disputeId: true,
        },
      },
    },
  });

  if (!delivery || !delivery.riderId) {
    await tx.delivery.updateMany({
      where: { id: deliveryId, payoutLocked: true },
      data: { payoutLocked: false },
    });
    return { skipped: true, reason: "DELIVERY_NOT_FOUND", deliveryId };
  }

  if (!isDeliveryRiderPayoutRequired(delivery)) {
    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        payoutReleasedAt: now,
        payoutLocked: false,
      },
    });
    await syncOrderPayoutReleasedStateInTx(tx, delivery.orderId);
    return { success: true, orderId: delivery.orderId, deliveryId: delivery.id };
  }

  if (!delivery.order.isPaid) {
    await tx.delivery.update({
      where: { id: delivery.id },
      data: { payoutLocked: false },
    });
    return {
      skipped: true,
      reason: "ORDER_NOT_PAID",
      orderId: delivery.orderId,
      deliveryId: delivery.id,
    };
  }

  if (delivery.order.disputeId) {
    await tx.delivery.update({
      where: { id: delivery.id },
      data: { payoutLocked: false },
    });
    return {
      skipped: true,
      reason: "ACTIVE_DISPUTE_LOCKED",
      orderId: delivery.orderId,
      deliveryId: delivery.id,
    };
  }

  if (delivery.payoutReleasedAt) {
    await tx.delivery.updateMany({
      where: { id: delivery.id, payoutLocked: true },
      data: { payoutLocked: false },
    });
    return {
      skipped: true,
      reason: "PAYOUT_ALREADY_RELEASED",
      orderId: delivery.orderId,
      deliveryId: delivery.id,
    };
  }

  const riderWallet = await tx.wallet.upsert({
    where: { userId: delivery.riderId },
    update: {},
    create: { userId: delivery.riderId },
    select: { id: true },
  });

  await tx.wallet.update({
    where: { id: riderWallet.id },
    data: {
      totalEarnings: { increment: delivery.riderPayoutAmount },
    },
  });

  await createDoubleEntryLedger(tx, {
    orderId: delivery.orderId,
    fromWalletId: systemEscrowAccount.walletId,
    toUserId: delivery.riderId,
    toWalletId: riderWallet.id,
    entryType: "RIDER_PAYOUT",
    amount: delivery.riderPayoutAmount,
    reference: `rider-release-${delivery.id}`,
    ...TREASURY_LEDGER_ROUTING.riderPayoutRelease,
    resolveFromWallet: false,
    resolveToWallet: false,
    context,
  });

  await settlePendingPayoutTransaction(tx, {
    reference: `pending-rider-${delivery.orderId}`,
    walletUserId: delivery.riderId,
    orderId: delivery.orderId,
    type: "RIDER_PAYOUT",
    amount: delivery.riderPayoutAmount,
    status: "SUCCESS",
    description: `Rider payout released by ${context.service}`,
  });

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

  await syncOrderPayoutReleasedStateInTx(tx, delivery.orderId);

  return {
    success: true,
    orderId: delivery.orderId,
    deliveryId: delivery.id,
  };
}
