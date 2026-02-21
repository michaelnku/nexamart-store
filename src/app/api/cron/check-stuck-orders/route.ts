import { acquireCronLock, releaseCronLock } from "@/lib/cron/workers/cronLock";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const LOCK_NAME = "check-stuck-orders";

  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) {
    return Response.json({
      skipped: true,
      reason: "Cron already running",
    });
  }

  try {
    const now = new Date();
    const HOURS = (h: number) => h * 60 * 60 * 1000;

    const stuckOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: new Date(now.getTime() - HOURS(24)),
        },
      },
      select: { id: true, userId: true },
    });

    for (const order of stuckOrders) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "ACCEPTED" },
        });

        await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            status: "ACCEPTED",
            message: "Order auto-moved to accepted due to inactivity",
          },
        });

        await tx.notification.create({
          data: {
            userId: order.userId,
            title: "Order Update",
            message: "Your order has been accepted.",
          },
        });
      });
    }

    return Response.json({
      ok: true,
      processed: stuckOrders.length,
    });
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
