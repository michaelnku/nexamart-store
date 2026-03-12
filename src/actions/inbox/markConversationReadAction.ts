"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function markConversationReadAction(conversationId: string) {
  const userId = await CurrentUserId();
  if (!userId) return;

  const isMember = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
    select: { id: true },
  });

  if (!isMember) return;

  await prisma.message.updateMany({
    where: {
      conversationId,
      readAt: null,
      OR: [
        { senderId: { not: userId } },
        { senderId: null, senderType: { in: ["SUPPORT", "SYSTEM"] } },
      ],
    },
    data: {
      readAt: new Date(),
    },
  });
}
