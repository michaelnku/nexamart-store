import { prisma } from "@/lib/prisma";
import { NotificationEvent } from "./notificationEvents";
import { Prisma } from "@/generated/prisma";

export async function createNotification({
  userId,
  event,
  title,
  message,
  link,
  key,
  metadata,
}: {
  userId: string;
  event: NotificationEvent;
  title: string;
  message: string;
  link?: string;
  key?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (key) {
    const existing = await prisma.notification.findUnique({
      where: { key },
    });

    if (existing) return existing;
  }

  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      link,
      type: event,
      key,
      metadata,
    },
  });
}
