"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function markNotificationRead(notificationId: string) {
  const userId = await CurrentUserId();

  if (!userId) return;

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      read: true,
    },
  });
}
