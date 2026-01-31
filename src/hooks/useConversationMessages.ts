"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";
import { ChatMessage } from "@/lib/types";

type TypingPayload = {
  userId: string;
};

export function useConversationMessages({
  conversationId,
  onMessage,
  onTyping,
}: {
  conversationId: string;
  onMessage: (message: ChatMessage) => void;
  onTyping?: (payload: TypingPayload) => void;
}) {
  useEffect(() => {
    const channelName = `conversation-${conversationId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-message", onMessage);

    if (onTyping) {
      channel.bind("typing", onTyping);
    }

    return () => {
      channel.unbind("new-message", onMessage);

      if (onTyping) {
        channel.unbind("typing", onTyping);
      }

      pusherClient.unsubscribe(channelName);
    };
  }, [conversationId, onMessage, onTyping]);
}
