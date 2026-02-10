import { prisma } from "@/lib/prisma";
import { completeDeliveryAndPayRider } from "@/lib/rider/completeDeliveryPayout";
import { acquireCronLock, releaseCronLock } from "./cronLock";

const LOCK_NAME = "FINALIZE_DELIVERIES";

export async function finalizeDeliveredOrders() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) return { skipped: true };

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        payoutReleased: false,
        isPaid: true,
        delivery: {
          status: "DELIVERED",
        },
      },
      select: { id: true },
      take: 25,
    });

    let processed = 0;

    for (const order of orders) {
      try {
        await completeDeliveryAndPayRider(order.id);
        processed++;
      } catch (err) {
        console.error(
          `[finalizeDeliveredOrders] Failed for order ${order.id}`,
          err,
        );
      }
    }

    return { processed };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
