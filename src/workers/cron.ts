import { prisma } from "@/lib/prisma";
import cron from "node-cron";
import { createDailyEscrowSnapshot } from "@/lib/cron/createEscrowSnapshot";
import { finalizeDeliveredOrders } from "@/lib/cron/finalizeDeliveredOrders";
import { releaseEligibleRiderPayouts } from "@/lib/cron/releaseEligibleRiderPayouts";
import { processHubTimeouts } from "@/lib/cron/processHubTimeouts";

type StuckOrderPayload = {
  orderId: string;
};

function isStuckOrderPayload(payload: unknown): payload is StuckOrderPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return typeof candidate.orderId === "string";
}

cron.schedule("*/2 * * * *", async () => {
  await finalizeDeliveredOrders();
  await releaseEligibleRiderPayouts();
  await processHubTimeouts();

  const jobs = await prisma.job.findMany({
    where: { type: "HANDLE_STUCK_ORDER", status: "PENDING" },
    take: 10,
  });

  for (const job of jobs) {
    if (!isStuckOrderPayload(job.payload)) continue;
    const { orderId } = job.payload;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "ACCEPTED" },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: "ACCEPTED",
          message: "Order auto-accepted by worker",
        },
      });

      await tx.job.update({
        where: { id: job.id },
        data: { status: "DONE" },
      });
    });
  }
});

cron.schedule("0 0 * * *", async () => {
  await createDailyEscrowSnapshot();
});
