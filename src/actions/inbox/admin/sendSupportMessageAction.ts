"use server";

import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { SenderType } from "@/generated/prisma/client";
import {
  createConversationMessage,
  publishConversationMessage,
} from "@/lib/inbox/conversationService";

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

  const supportMessage = await createConversationMessage(prisma, {
    conversationId,
    senderId: userId,
    senderType: SenderType.SUPPORT,
    content: text,
  });

  await publishConversationMessage(supportMessage);

  return { success: true };
}
