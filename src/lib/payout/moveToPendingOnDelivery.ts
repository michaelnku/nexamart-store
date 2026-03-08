import { prisma } from "@/lib/prisma";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";

const ESCROW_DELAY_MS = 24 * 60 * 60 * 1000;

type PendingMoveResult = { success: true } | { skipped: true; reason: string };

export async function moveOrderEarningsToPending(
  orderId: string,
): Promise<PendingMoveResult> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: {
          select: {
            riderId: true,
            fee: true,
            status: true,
          },
        },
        sellerGroups: {
          select: {
            id: true,
            sellerId: true,
            subtotal: true,
          },
        },
      },
    });

    if (!order) return { skipped: true, reason: "ORDER_NOT_FOUND" };
    if (!order.isPaid) return { skipped: true, reason: "ORDER_NOT_PAID" };
    if (order.status !== "DELIVERED")
      return { skipped: true, reason: "ORDER_NOT_DELIVERED" };
    if (!order.customerConfirmedAt)
      return { skipped: true, reason: "MISSING_CONFIRMATION_TIME" };
    if (!order.delivery || !order.delivery.riderId)
      return { skipped: true, reason: "MISSING_DELIVERY_OR_RIDER" };
    if (order.delivery.status !== "DELIVERED")
      return { skipped: true, reason: "DELIVERY_NOT_CONFIRMED" };

    // ---------------- SELLER ESCROW ----------------

    for (const group of order.sellerGroups) {
      await createEscrowEntryIdempotent(tx, {
        orderId,
        userId: group.sellerId,
        role: "SELLER",
        entryType: "SELLER_EARNING",
        amount: group.subtotal,
        status: "HELD",
        reference: `seller-held-${group.id}`,
        metadata: {
          sellerGroupId: group.id,
          subtotal: group.subtotal,
        },
      });

      const sellerWallet = await tx.wallet.upsert({
        where: { userId: group.sellerId },
        update: {},
        create: { userId: group.sellerId },
        select: { id: true },
      });

      await tx.transaction.upsert({
        where: {
          reference: `pending-seller-${group.id}`,
        },
        update: {},
        create: {
          walletId: sellerWallet.id,
          userId: group.sellerId,
          orderId,
          type: "SELLER_PAYOUT",
          status: "PENDING",
          amount: group.subtotal,
          reference: `pending-seller-${group.id}`,
          description: `Escrow hold for order ${orderId}`,
        },
      });
    }

    // ---------------- RIDER ESCROW ----------------
    await createEscrowEntryIdempotent(tx, {
      orderId,
      userId: order.delivery.riderId,
      role: "RIDER",
      entryType: "RIDER_EARNING",
      amount: order.delivery.fee,
      status: "HELD",
      reference: `rider-held-${orderId}`,
    });

    const riderWallet = await tx.wallet.upsert({
      where: { userId: order.delivery.riderId },
      update: {},
      create: { userId: order.delivery.riderId },
      select: { id: true },
    });

    await tx.transaction.upsert({
      where: {
        reference: `pending-rider-${orderId}`,
      },
      update: {},
      create: {
        walletId: riderWallet.id,
        userId: order.delivery.riderId,
        orderId,
        type: "RIDER_PAYOUT",
        status: "PENDING",
        amount: order.delivery.fee,
        reference: `pending-rider-${orderId}`,
        description: `Delivery payout pending release`,
      },
    });

    // ---------------- PAYOUT TIMERS ----------------
    const releaseAt = new Date(
      order.customerConfirmedAt.getTime() + ESCROW_DELAY_MS,
    );

    await tx.delivery.updateMany({
      where: {
        orderId,
        status: "DELIVERED",
        payoutEligibleAt: null,
      },
      data: {
        payoutEligibleAt: releaseAt,
        payoutLocked: false,
      },
    });

    for (const group of order.sellerGroups) {
      await tx.orderSellerGroup.updateMany({
        where: {
          id: group.id,
          payoutStatus: "PENDING",
          payoutEligibleAt: null,
        },
        data: {
          payoutEligibleAt: releaseAt,
          payoutLocked: false,
        },
      });
    }

    return { success: true };
  });
}
