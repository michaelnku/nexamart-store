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
