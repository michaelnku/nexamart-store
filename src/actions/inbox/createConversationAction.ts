"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { SenderType } from "@/generated/prisma/client";
import {
  persistConversationMessage,
  processConversationMessageAfterWrite,
} from "@/lib/inbox/conversationService";

export async function createConversationAction({
  subject,
  message,
}: {
  subject?: string;
  message: string;
}) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const cleanMessage = message.trim();
  if (!cleanMessage) return { error: "Message cannot be empty" };

  const conversation = await prisma.$transaction(async (tx) => {
    const createdConversation = await tx.conversation.create({
      data: {
        userId,
        type: "SUPPORT",
        status: "OPEN",
        subject: subject?.trim() || "Support Request",
        members: {
          create: {
            userId,
          },
        },
      },
      select: {
        id: true,
        subject: true,
      },
    });

    await persistConversationMessage(tx, {
      conversationId: createdConversation.id,
      senderType: SenderType.SYSTEM,
      content: "Hello. I'm NexaMart AI Assistant. A support agent will assist you shortly.",
    });

    const createdUserMessage = await persistConversationMessage(tx, {
      conversationId: createdConversation.id,
      senderId: userId,
      senderType: SenderType.USER,
      content: cleanMessage,
    });

    const messages = await tx.message.findMany({
      where: { conversationId: createdConversation.id },
      orderBy: { createdAt: "asc" },
    });

    return {
      ...createdConversation,
      createdUserMessage,
      messages,
    };
  });

  await processConversationMessageAfterWrite(conversation.createdUserMessage);

  return {
    ok: true,
    conversation: {
      id: conversation.id,
      subject: conversation.subject,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        conversationId: conversation.id,
        senderId: m.senderId ?? null,
        senderType: m.senderType,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
        deliveredAt: m.deliveredAt?.toISOString() ?? null,
      })),
    },
  };
}
