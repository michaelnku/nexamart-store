import { prisma } from "@/lib/prisma";

export async function isRiderScheduledNow(riderId: string) {
  const now = new Date();

  const dayOfWeek = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);

  const schedule = await prisma.riderSchedule.findFirst({
    where: {
      riderId,
      dayOfWeek,
      isActive: true,
      startTime: { lte: currentTime },
      endTime: { gte: currentTime },
    },
  });

  return Boolean(schedule);
}
