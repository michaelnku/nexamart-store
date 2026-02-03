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
  onDelivered,
  onSeen,
  onTyping,
}: {
  conversationId: string;
  onMessage: (message: ChatMessage) => void;
  onDelivered?: (payload: { deliveredAt: string }) => void;
  onSeen?: (payload: { readAt: string }) => void;
  onTyping?: (payload: TypingPayload) => void;
}) {
  useEffect(() => {
    const channelName = `conversation-${conversationId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-message", onMessage);
    if (onDelivered) channel.bind("delivered", onDelivered);
    if (onSeen) channel.bind("seen", onSeen);

    if (onTyping) {
      channel.bind("typing", onTyping);
    }

    return () => {
      channel.unbind("new-message", onMessage);
      if (onDelivered) channel.unbind("delivered", onDelivered);
      if (onSeen) channel.unbind("seen", onSeen);
      if (onTyping) channel.unbind("typing", onTyping);
      pusherClient.unsubscribe(channelName);
    };
  }, [conversationId, onMessage, onDelivered, onSeen, onTyping]);
}
