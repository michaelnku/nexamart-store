"use server";

import {
  SenderType,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";
import { pusherServer } from "@/lib/pusher";

export type RealtimeMessagePayload = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: SenderType;
  content: string;
  createdAt: string;
};

type MessageWriter = Prisma.TransactionClient | PrismaClient;

export async function createConversationMessage(
  db: MessageWriter,
  input: {
    conversationId: string;
    senderId?: string | null;
    senderType: SenderType;
    content: string;
  },
) {
  const message = await db.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId ?? null,
      senderType: input.senderType,
      content: input.content.trim(),
    },
  });

  await db.conversation.update({
    where: { id: input.conversationId },
    data: {
      lastMessageAt: message.createdAt,
    },
  });

  return message;
}

function toRealtimeMessagePayload(message: {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: SenderType;
  content: string;
  createdAt: Date;
}): RealtimeMessagePayload {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderType: message.senderType,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function publishConversationMessage(message: {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: SenderType;
  content: string;
  createdAt: Date;
}) {
  await pusherServer.trigger(
    `conversation-${message.conversationId}`,
    "new-message",
    toRealtimeMessagePayload(message),
  );
}
