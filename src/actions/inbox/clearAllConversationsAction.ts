"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function clearAllConversationsAction() {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  const ids = memberships.map((m) => m.conversationId);
  if (ids.length === 0) return { success: true };

  await prisma.message.deleteMany({
    where: { conversationId: { in: ids } },
  });

  await prisma.conversationMember.deleteMany({
    where: { conversationId: { in: ids } },
  });

  await prisma.conversation.deleteMany({
    where: { id: { in: ids } },
  });

  return { success: true };
}
