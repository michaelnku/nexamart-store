import { prisma } from "@/lib/prisma";

export async function scheduleSellerAnalyticsJob() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const exists = await prisma.job.findFirst({
    where: {
      type: "SELLER_DAILY_STATS",
      runAt: {
        gte: today,
      },
    },
  });

  if (exists) return;

  await prisma.job.create({
    data: {
      type: "SELLER_DAILY_STATS",
      payload: {},
      runAt: new Date(),
    },
  });
}
