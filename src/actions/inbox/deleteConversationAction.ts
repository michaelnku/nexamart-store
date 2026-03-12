"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function deleteConversationAction(conversationId: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const isMember = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
    select: { id: true },
  });

  if (!isMember) return { error: "Not allowed in this conversation" };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      type: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!conversation) return { error: "Conversation not found" };
  if (conversation.type !== "SUPPORT" && conversation._count.members > 1) {
    return { error: "Shared conversations cannot be deleted from the inbox" };
  }

  await prisma.message.deleteMany({
    where: { conversationId },
  });

  await prisma.conversationMember.deleteMany({
    where: { conversationId },
  });

  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  return { success: true };
}
