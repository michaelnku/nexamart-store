"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { pusherServer } from "@/lib/pusher";
import { SenderType } from "@/generated/prisma/client";
import { autoModeratorReply } from "./autoModeratorReply";

export type RealtimeMessagePayload = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: SenderType;
  content: string;
  createdAt: string;
};

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

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) return { error: "Conversation not found" };

  const isMember = await prisma.conversationMember.findFirst({
    where: {
      conversationId,
      userId,
    },
  });

  if (!isMember) {
    return { error: "Not allowed in this conversation" };
  }

  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      senderType: SenderType.USER,
      content: text,
    },
  });

  const userPayload: RealtimeMessagePayload = {
    id: userMessage.id,
    conversationId,
    senderId: userMessage.senderId,
    senderType: userMessage.senderType,
    content: userMessage.content,
    createdAt: userMessage.createdAt.toISOString(),
  };

  await pusherServer.trigger(
    `conversation-${conversationId}`,
    "new-message",
    userPayload,
  );

  const aiMessage = await autoModeratorReply({
    conversationId,
    userMessage: text,
  });

  if (aiMessage) {
    await pusherServer.trigger(
      `conversation-${conversationId}`,
      "new-message",
      aiMessage,
    );
  }

  return { success: true };
}
