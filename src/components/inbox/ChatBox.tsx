"use client";

import { useState } from "react";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useConversationPresence } from "@/hooks/useConversationPresence";
import { ChatMessage } from "@/lib/types";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import { ChatInput } from "./ChatInput";

type PresenceRole = "ADMIN" | "MODERATOR" | "SELLER" | "RIDER" | "USER";

type Props = {
  conversationId: string;
  initialMessages: ChatMessage[];
  selfUserId?: string | null;
  title: string;
  subtitle?: string;
  forceOnline?: boolean;
  presenceTargetRoles?: PresenceRole[];
  onOpenMenu?: () => void;
  onPreviewUpdate?: (payload: {
    content: string;
    senderId?: string | null;
    senderType: ChatMessage["senderType"];
    createdAt: string;
  }) => void;
};

function isIncomingMessage(message: ChatMessage, selfUserId?: string | null) {
  if (selfUserId && message.senderId) {
    return message.senderId !== selfUserId;
  }

  return message.senderType === "SUPPORT" || message.senderType === "SYSTEM";
}

function isOwnMessage(message: ChatMessage, selfUserId?: string | null) {
  return Boolean(selfUserId && message.senderId && message.senderId === selfUserId);
}

export default function ChatBox({
  conversationId,
  initialMessages,
  selfUserId,
  title,
  subtitle,
  forceOnline,
  presenceTargetRoles,
  onOpenMenu,
  onPreviewUpdate,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const { online, typing, lastSeenAt } = useConversationPresence(conversationId, {
    targetRoles: presenceTargetRoles,
    selfUserId,
  });

  useConversationMessages({
    conversationId,
    onMessage: async (message) => {
      setMessages((prev) => {
        if (prev.find((current) => current.id === message.id)) return prev;
        return [...prev, message];
      });

      onPreviewUpdate?.({
        content: message.content,
        senderId: message.senderId ?? null,
        senderType: message.senderType,
        createdAt: message.createdAt,
      });

      if (isIncomingMessage(message, selfUserId)) {
        await fetch("/api/messages/delivered", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        }).catch(() => {});

        await fetch("/api/messages/seen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        }).catch(() => {});
      }
    },
    onDelivered: ({ deliveredAt }) => {
      setMessages((prev) =>
        prev.map((message) =>
          isOwnMessage(message, selfUserId) && !message.deliveredAt
            ? { ...message, deliveredAt }
            : message,
        ),
      );
    },
    onSeen: ({ readAt }) => {
      setMessages((prev) =>
        prev.map((message) =>
          isOwnMessage(message, selfUserId) && !message.readAt
            ? { ...message, readAt }
            : message,
        ),
      );
    },
  });

  return (
    <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden bg-background py-4">
      <div className="shrink-0">
        <ChatHeader
          title={title}
          subtitle={subtitle}
          online={forceOnline ? true : online}
          lastSeenAt={forceOnline ? null : lastSeenAt}
          showMenuButton
          onMenuToggle={onOpenMenu}
        />
      </div>

      <MessageList messages={messages} typing={typing} viewerUserId={selfUserId} />

      <div className="shrink-0">
        <ChatInput
          conversationId={conversationId}
          selfUserId={selfUserId}
          onPreviewUpdate={onPreviewUpdate}
        />
      </div>
    </div>
  );
}
