"use server";

import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { SenderType } from "@/generated/prisma/client";

export async function assignAgentAction({
  conversationId,
  agentId,
}: {
  conversationId: string;
  agentId: string;
}) {
  if (!agentId) return { error: "Missing agent id" };

  try {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        agentId,
      },
    });

    const systemMessage = await prisma.message.create({
      data: {
        conversationId,
        senderType: SenderType.SYSTEM,
        content: "A support agent has joined the conversation 👋",
      },
    });

    await pusherServer.trigger(`conversation-${conversationId}`, "new-message", {
      id: systemMessage.id,
      conversationId,
      senderId: null,
      senderType: SenderType.SYSTEM,
      content: systemMessage.content,
      createdAt: systemMessage.createdAt.toISOString(),
    });

    await pusherServer.trigger(
      `conversation-${conversationId}`,
      "agent-assigned",
      { agentId },
    );

    return { success: true };
  } catch {
    return { error: "Failed to assign agent" };
  }
}

