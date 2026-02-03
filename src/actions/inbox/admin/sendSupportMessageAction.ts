"use server";

import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { pusherServer } from "@/lib/pusher";
import { SenderType } from "@/generated/prisma/client";

export async function sendSupportMessageAction({
  conversationId,
  content,
}: {
  conversationId: string;
  content: string;
}) {
  const userId = await CurrentUserId();
  const role = await CurrentRole();
  if (!userId || role !== "ADMIN") return { error: "Unauthorized" };

  const text = content.trim();
  if (!text) return { error: "Message cannot be empty" };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { agentId: true },
  });

  if (!conversation) return { error: "Conversation not found" };
  if (conversation.agentId && conversation.agentId !== userId) {
    return { error: "Assigned to another agent" };
  }

  const supportMessage = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      senderType: SenderType.SUPPORT,
      content: text,
    },
  });

  await pusherServer.trigger(
    `conversation-${conversationId}`,
    "new-message",
    {
      id: supportMessage.id,
      conversationId,
      senderId: supportMessage.senderId,
      senderType: supportMessage.senderType,
      content: supportMessage.content,
      createdAt: supportMessage.createdAt.toISOString(),
    },
  );

  return { success: true };
}
