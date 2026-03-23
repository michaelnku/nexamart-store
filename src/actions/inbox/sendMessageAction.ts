"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import {
  createAndProcessConversationMessage,
} from "@/lib/inbox/conversationService";
import { SenderType } from "@/generated/prisma/client";

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

  await createAndProcessConversationMessage({
    conversationId,
    senderId: userId,
    senderType: SenderType.USER,
    content: text,
  }, {
    publish: true,
  });

  return { success: true };
}
