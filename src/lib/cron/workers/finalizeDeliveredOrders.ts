import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "./cronLock";
import { releaseEligibleSellerGroups } from "@/lib/cron/workers/releaseEligibleSellerGroups";

const LOCK_NAME = "FINALIZE_DELIVERIES";
const ESCROW_DELAY_MS = 24 * 60 * 60 * 1000;

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
        order: { select: { customerConfirmedAt: true } },
      },
      take: 25,
    });

    for (const group of groupsNeedingEligibility) {
      if (!group.order.customerConfirmedAt) continue;
      const payoutEligibleAt = new Date(
        group.order.customerConfirmedAt.getTime() + ESCROW_DELAY_MS,
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

    const releaseResult = await releaseEligibleSellerGroups();

    return {
      processedGroups:
        "processed" in releaseResult ? releaseResult.processed : 0,
      at: now.toISOString(),
    };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
