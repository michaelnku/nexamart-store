"use server";

import { SenderType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function autoModeratorReply({
  conversationId,
  userMessage,
}: {
  conversationId: string;
  userMessage: string;
}) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { agentId: true },
  });

  if (conversation?.agentId) return;

  let reply =
    "Thanks for reaching out. A support agent will assist you shortly.";

  if (/refund/i.test(userMessage)) {
    reply =
      "I see you're asking about a refund. I’ve notified our support team.";
  } else if (/order/i.test(userMessage)) {
    reply = "Let me help with your order. A support agent will review this.";
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderType: SenderType.SYSTEM,
      content: reply,
    },
  });

  return {
    id: message.id,
    conversationId,
    senderId: null,
    senderType: message.senderType,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}
