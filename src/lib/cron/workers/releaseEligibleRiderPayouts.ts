import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/workers/cronLock";
import {
  createServiceContext,
  ServiceContext,
} from "@/lib/system/serviceContext";
import { releaseRiderDeliveryPayoutInTx } from "@/lib/payout/riderPayouts";

const LOCK_NAME = "RELEASE_ELIGIBLE_RIDER_PAYOUTS";
const BATCH_SIZE = 20;

async function processRiderDeliveryPayout(
  tx: Prisma.TransactionClient,
  deliveryId: string,
  now: Date,
  context: ServiceContext,
): Promise<boolean> {
  const released = await releaseRiderDeliveryPayoutInTx(
    tx,
    deliveryId,
    now,
    context,
  );
  return "success" in released;
}

export async function releaseEligibleRiderPayouts() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) {
    return { skipped: true, processed: 0 };
  }

  try {
    const now = new Date();
    const context = createServiceContext("RIDER_PAYOUT_CRON");

    const deliveries = await prisma.delivery.findMany({
      where: {
        status: "DELIVERED",
        payoutEligibleAt: { lte: now },
        payoutReleasedAt: null,
        payoutLocked: false,
        fee: { gt: 0 },
        riderId: { not: null },
        order: {
          isPaid: true,
          disputeId: null,
        },
      },
      orderBy: { payoutEligibleAt: "asc" },
      select: { id: true },
      take: BATCH_SIZE,
    });

    let processed = 0;

    for (const candidate of deliveries) {
      await prisma.$transaction(async (tx) => {
        const released = await processRiderDeliveryPayout(
          tx,
          candidate.id,
          now,
          context,
        );

        if (released) {
          processed += 1;
        }
      });
    }

    return { skipped: false, processed };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}

export async function releaseEligibleRiderPayoutForOrder(orderId: string) {
  const now = new Date();
  const context = createServiceContext("RIDER_PAYOUT_CRON");

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findFirst({
      where: {
        orderId,
        status: "DELIVERED",
        payoutReleasedAt: null,
        payoutLocked: false,
        payoutEligibleAt: { lte: now },
        fee: { gt: 0 },
        riderId: { not: null },
        order: {
          isPaid: true,
          disputeId: null,
        },
      },
      select: { id: true },
    });

    if (!delivery) {
      return { skipped: true };
    }

    const released = await processRiderDeliveryPayout(
      tx,
      delivery.id,
      now,
      context,
    );

    return { skipped: !released };
  });
}
