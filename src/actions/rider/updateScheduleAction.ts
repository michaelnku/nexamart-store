"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId, CurrentRole } from "@/lib/currentUser";

export async function updateRiderSchedule(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId || role !== "RIDER") {
    return { error: "Forbidden" };
  }

  await prisma.riderSchedule.upsert({
    where: {
      riderId_dayOfWeek: {
        riderId: userId,
        dayOfWeek,
      },
    },
    update: {
      startTime,
      endTime,
      isActive: true,
    },
    create: {
      riderId: userId,
      dayOfWeek,
      startTime,
      endTime,
    },
  });

  return { success: true };
}
