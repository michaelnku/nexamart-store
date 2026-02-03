"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { pusherServer } from "@/lib/pusher";

export async function sendTypingAction({
  conversationId,
}: {
  conversationId: string;
}) {
  const userId = await CurrentUserId();
  if (!userId) return;

  await pusherServer.trigger(
    `presence-conversation-${conversationId}`,
    "typing",
    {
      userId,
      timestamp: Date.now(),
    },
  );
}
