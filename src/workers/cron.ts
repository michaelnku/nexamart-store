import { prisma } from "@/lib/prisma";
import cron from "node-cron";

cron.schedule("*/2 * * * *", async () => {
  const jobs = await prisma.job.findMany({
    where: { type: "HANDLE_STUCK_ORDER", status: "PENDING" },
    take: 10,
  });

  for (const job of jobs) {
    const { orderId } = job.payload as any;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: "PROCESSING",
          message: "Order auto-recovered by worker",
        },
      });

      await tx.job.update({
        where: { id: job.id },
        data: { status: "DONE" },
      });
    });
  }
});
