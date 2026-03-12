import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "./cronLock";
import { releaseEligibleSellerGroups } from "@/lib/cron/workers/releaseEligibleSellerGroups";
import { moveOrderEarningsToPending } from "@/lib/payout/moveToPendingOnDelivery";
import { getPayoutEligibleAtFrom } from "@/lib/payout/timing";

const LOCK_NAME = "FINALIZE_DELIVERIES";

export async function finalizeDeliveredOrders() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) return { skipped: true };

  try {
    const now = new Date();

    // Migration note:
    // Backfill payout eligibility for legacy delivered groups created before
    // group-level payout scheduling. This is idempotent and only touches groups
    // that are still pending and missing payoutEligibleAt.
    const groupsNeedingEligibility = await prisma.orderSellerGroup.findMany({
      where: {
        payoutStatus: "PENDING",
        payoutEligibleAt: null,
        order: {
          isPaid: true,
          status: "DELIVERED",
          customerConfirmedAt: { not: null },
        },
      },
      select: {
        id: true,
        order: { select: { customerConfirmedAt: true, isFoodOrder: true } },
      },
      take: 25,
    });

    for (const group of groupsNeedingEligibility) {
      if (!group.order.customerConfirmedAt) continue;
      const payoutEligibleAt = getPayoutEligibleAtFrom(
        group.order.customerConfirmedAt,
        group.order.isFoodOrder,
      );

      await prisma.orderSellerGroup.updateMany({
        where: {
          id: group.id,
          payoutStatus: "PENDING",
          payoutEligibleAt: null,
        },
        data: {
          payoutEligibleAt,
          payoutLocked: false,
        },
      });
    }

    // Backfill pending payout transaction history for delivered orders that are
    // still awaiting payout release. This reuses the normal delivery-to-pending
    // flow so transaction rows are created with the same references and
    // idempotency guarantees as fresh OTP-confirmed deliveries.
    const ordersNeedingPendingHistory = await prisma.order.findMany({
      where: {
        isPaid: true,
        status: "DELIVERED",
        customerConfirmedAt: { not: null },
        payoutReleased: false,
        OR: [
          {
            sellerGroups: {
              some: {
                payoutStatus: "PENDING",
                payoutReleasedAt: null,
              },
            },
          },
          {
            delivery: {
              is: {
                status: "DELIVERED",
                riderId: { not: null },
                payoutReleasedAt: null,
              },
            },
          },
        ],
      },
      select: { id: true },
      orderBy: { customerConfirmedAt: "asc" },
      take: 25,
    });

    let pendingBackfilledOrders = 0;

    for (const order of ordersNeedingPendingHistory) {
      const result = await moveOrderEarningsToPending(order.id);

      if (!("skipped" in result)) {
        pendingBackfilledOrders += 1;
      }
    }

    const releaseResult = await releaseEligibleSellerGroups();

    return {
      pendingBackfilledOrders,
      processedGroups:
        "processed" in releaseResult ? releaseResult.processed : 0,
      at: now.toISOString(),
    };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
