"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function clearAllConversationsAction() {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    select: {
      conversationId: true,
      conversation: {
        select: {
          type: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  const ids = memberships
    .filter(
      ({ conversation }) =>
        conversation.type === "SUPPORT" || conversation._count.members <= 1,
    )
    .map((membership) => membership.conversationId);

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
