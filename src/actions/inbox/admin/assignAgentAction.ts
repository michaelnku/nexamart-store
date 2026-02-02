"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { pusherServer } from "@/lib/pusher";

export async function assignAgentAction(conversationId: string) {
  const agentId = await CurrentUserId();
  if (!agentId) return { error: "Unauthorized" };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) return { error: "Conversation not found" };
  if (conversation.agentId) return { error: "Already assigned" };

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      agentId,
    },
  });

  if (!updated) return { error: "Failed to assign agent" };

  await prisma.message.create({
    data: {
      conversationId,
      senderType: "SYSTEM",
      content: "A support agent has joined the conversation.",
    },
  });

  await pusherServer.trigger(
    `conversation-${conversationId}`,
    "agent-assigned",
    {
      agentId,
      conversationId,
    },
  );

  return { success: true };
}
