import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
  key,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  key?: string;
}) {
  if (key) {
    const exists = await prisma.notification.findUnique({
      where: { key },
    });

    if (exists) return exists;
  }

  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
      key,
    },
  });
}
