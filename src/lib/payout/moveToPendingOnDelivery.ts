import { prisma } from "@/lib/prisma";
import {
  createEscrowEntryIdempotent,
} from "@/lib/ledger/idempotentEntries";

const ESCROW_DELAY_MS = 24 * 60 * 60 * 1000;

type PendingMoveResult =
  | { success: true }
  | { skipped: true; reason: string };

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
    if (order.status !== "DELIVERED") {
      return { skipped: true, reason: "ORDER_NOT_DELIVERED" };
    }
    if (!order.customerConfirmedAt) {
      return { skipped: true, reason: "MISSING_CONFIRMATION_TIME" };
    }
    if (!order.delivery || !order.delivery.riderId) {
      return { skipped: true, reason: "MISSING_DELIVERY_OR_RIDER" };
    }
    if (order.delivery.status !== "DELIVERED") {
      return { skipped: true, reason: "DELIVERY_NOT_CONFIRMED" };
    }

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
    }

    await createEscrowEntryIdempotent(tx, {
      orderId,
      userId: order.delivery.riderId,
      role: "RIDER",
      entryType: "RIDER_EARNING",
      amount: order.delivery.fee,
      status: "HELD",
      reference: `rider-held-${orderId}`,
    });

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

    // Migration note:
    // Group-level payouts are now released independently. We stamp each
    // seller group with payout eligibility instead of scheduling an order-level
    // release job, while retaining idempotency on repeated delivery callbacks.
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
