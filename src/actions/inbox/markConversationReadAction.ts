"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function markConversationReadAction(conversationId: string) {
  const userId = await CurrentUserId();
  if (!userId) return;

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderType: { not: "USER" },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}
