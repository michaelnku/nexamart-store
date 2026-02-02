"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { SenderType } from "@/generated/prisma/client";
import { read } from "fs";

export async function createConversationAction({
  subject,
  message,
}: {
  subject?: string;
  message: string;
}) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  if (!message.trim()) {
    return { error: "Message cannot be empty" };
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId,
      type: "SUPPORT",
      subject: subject ?? "Support Request",
      members: {
        create: {
          userId,
        },
      },
      messages: {
        createMany: {
          data: [
            {
              senderType: SenderType.SYSTEM,
              content:
                "Hello 👋 I’m NexaMart AI Assistant. A support agent will assist you shortly.",
            },
            {
              senderId: userId,
              senderType: SenderType.USER,
              content: message.trim(),
            },
          ],
        },
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return {
    ok: true,
    conversation: {
      id: conversation.id,
      subject: conversation.subject,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        conversationId: conversation.id,
        senderType: m.senderType,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        readAt: null,
      })),
    },
  };
}
