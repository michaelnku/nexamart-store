"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { pusherServer } from "@/lib/pusher";
import { SenderType } from "@/generated/prisma/client";

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

  if (!content.trim()) {
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

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      senderType: SenderType.USER,
      content: content.trim(),
    },
  });

  const payload: RealtimeMessagePayload = {
    id: message.id,
    conversationId,
    senderId: message.senderId,
    senderType: message.senderType,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };

  await pusherServer.trigger(
    `conversation-${conversationId}`,
    "new-message",
    payload,
  );

  return { success: true, message: payload };
}
