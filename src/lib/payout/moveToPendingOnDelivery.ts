import { prisma } from "@/lib/prisma";
import { buildSellerNetByUser } from "@/lib/payout/escrowBreakdown";

const ESCROW_DELAY_MS = 24 * 60 * 60 * 1000;

type PendingMoveResult =
  | { success: true }
  | { skipped: true; reason: string };

type EscrowPayload = {
  orderId: string;
  releaseAt: string;
};

function isEscrowPayload(payload: unknown): payload is EscrowPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.orderId === "string" &&
    typeof candidate.releaseAt === "string"
  );
}

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
            store: {
              select: {
                type: true,
              },
            },
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
    if (!order.customerConfirmedAt) {
      return { skipped: true, reason: "MISSING_CONFIRMATION_TIME" };
    }
    if (!order.delivery || !order.delivery.riderId) {
      return { skipped: true, reason: "MISSING_DELIVERY_OR_RIDER" };
    }
    if (order.delivery.status !== "DELIVERED") {
      return { skipped: true, reason: "DELIVERY_NOT_CONFIRMED" };
    }

    const existingEscrowJobs = await tx.job.findMany({
      where: {
        type: "RELEASE_ESCROW_PAYOUT",
        status: {
          in: ["PENDING", "DONE"],
        },
      },
      select: {
        payload: true,
      },
    });

    const hasEscrowJob = existingEscrowJobs.some((job) => {
      if (!isEscrowPayload(job.payload)) return false;
      return job.payload.orderId === orderId;
    });

    if (hasEscrowJob) {
      return { skipped: true, reason: "ESCROW_ALREADY_QUEUED" };
    }

    const sellerNetByUserId = buildSellerNetByUser(order.sellerGroups);

    for (const [sellerId, sellerNet] of sellerNetByUserId) {
      const sellerWallet = await tx.wallet.upsert({
        where: { userId: sellerId },
        update: {},
        create: { userId: sellerId },
        select: { id: true },
      });

      await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: {
          pending: { increment: sellerNet },
        },
      });
    }

    const riderWallet = await tx.wallet.upsert({
      where: { userId: order.delivery.riderId },
      update: {},
      create: { userId: order.delivery.riderId },
      select: { id: true },
    });

    await tx.wallet.update({
      where: { id: riderWallet.id },
      data: {
        pending: { increment: order.delivery.fee },
      },
    });

    const releaseAt = new Date(
      order.customerConfirmedAt.getTime() + ESCROW_DELAY_MS,
    );

    await tx.job.create({
      data: {
        type: "RELEASE_ESCROW_PAYOUT",
        payload: {
          orderId,
          releaseAt: releaseAt.toISOString(),
        },
      },
    });

    return { success: true };
  });
}
