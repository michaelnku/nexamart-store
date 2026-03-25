import { prisma } from "@/lib/prisma";
import { NotificationEvent } from "./notificationEvents";
import { Prisma } from "@/generated/prisma";
import { pusherServer } from "@/lib/pusher";

type CreateNotificationInput = {
  userId: string;
  event: NotificationEvent;
  title: string;
  message: string;
  link?: string;
  key?: string;
  metadata?: Prisma.InputJsonValue;
};

async function createNotificationRecord({
  userId,
  event,
  title,
  message,
  link,
  key,
  metadata,
}: CreateNotificationInput) {
  if (key) {
    const existing = await prisma.notification.findUnique({
      where: { key },
    });

    if (existing) {
      return {
        notification: existing,
        created: false,
      };
    }
  }

  const notification = await prisma.notification.create({
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

  return {
    notification,
    created: true,
  };
}

export async function createNotification({
  userId,
  event,
  title,
  message,
  link,
  key,
  metadata,
}: CreateNotificationInput) {
  const result = await createNotificationRecord({
    userId,
    event,
    title,
    message,
    link,
    key,
    metadata,
  });

  return result.notification;
}

export async function createRealtimeNotification(
  input: CreateNotificationInput,
) {
  const result = await createNotificationRecord(input);

  if (result.created) {
    await pusherServer.trigger(
      `notifications-${input.userId}`,
      "new-notification",
      result.notification,
    );
  }

  return result.notification;
}
