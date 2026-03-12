"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { SenderType } from "@/generated/prisma/client";
import {
  createConversationMessage,
  publishConversationMessage,
} from "@/lib/inbox/conversationService";

export async function sendMessageAction({
  conversationId,
  content,
}: {
  conversationId: string;
  content: string;
}) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const text = content.trim();
  if (!text) {
    return { error: "Message cannot be empty" };
  }

  const isMember = await prisma.conversationMember.findFirst({
    where: {
      conversationId,
      userId,
    },
  });

  if (!isMember) {
    return { error: "Not allowed in this conversation" };
  }

  const userMessage = await createConversationMessage(prisma, {
    conversationId,
    senderId: userId,
    senderType: SenderType.USER,
    content: text,
  });

  await publishConversationMessage(userMessage);

  return { success: true };
}
