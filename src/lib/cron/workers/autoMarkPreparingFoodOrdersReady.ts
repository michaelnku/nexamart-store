import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/workers/cronLock";
import { markSellerGroupReady } from "@/lib/order/markSellerGroupReady";

const LOCK_NAME = "AUTO_MARK_PREPARING_FOOD_READY";
const BATCH_SIZE = 25;

export async function autoMarkPreparingFoodOrdersReady() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) return { skipped: true, processed: 0 };

  try {
    const now = new Date();

    const dueGroups = await prisma.orderSellerGroup.findMany({
      where: {
        status: "PREPARING",
        readyAt: { lte: now },
        order: { isFoodOrder: true },
      },
      select: { id: true },
      orderBy: { readyAt: "asc" },
      take: BATCH_SIZE,
    });

    let processed = 0;

    for (const group of dueGroups) {
      const result = await markSellerGroupReady(group.id, "AUTO");
      if (result.updated) processed += 1;
    }

    return { skipped: false, processed };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
