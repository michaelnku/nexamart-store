"use client";

import { useState } from "react";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useConversationPresence } from "@/hooks/useConversationPresence";
import { ChatMessage } from "@/lib/types";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import { ChatInput } from "./ChatInput";

type Props = {
  conversationId: string;
  agentId?: string | null;
  agentName?: string | null;
  selfUserId?: string | null;
  onOpenMenu?: () => void;

  initialMessages: ChatMessage[];
  onPreviewUpdate?: (payload: {
    content: string;
    senderType: ChatMessage["senderType"];
    createdAt: string;
  }) => void;
};

export default function ChatBox({
  conversationId,

  initialMessages,
  agentId,
  agentName,
  selfUserId,
  onOpenMenu,
  onPreviewUpdate,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const { online, typing, lastSeenAt } = useConversationPresence(
    conversationId,
    {
      targetRoles: ["ADMIN", "MODERATOR", "SELLER", "RIDER"],
      selfUserId,
    },
  );

  const isBot = !agentId;

  useConversationMessages({
    conversationId,
    onMessage: async (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onPreviewUpdate?.({
        content: msg.content,
        senderType: msg.senderType,
        createdAt: msg.createdAt,
      });
      if (msg.senderType === "SUPPORT") {
        await fetch("/api/messages/delivered", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            targetSenderType: "SUPPORT",
          }),
        }).catch(() => {});
        await fetch("/api/messages/seen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            targetSenderType: "SUPPORT",
          }),
        }).catch(() => {});
      }
    },
    onDelivered: ({ deliveredAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderType === "USER" && !m.deliveredAt ? { ...m, deliveredAt } : m,
        ),
      );
    },
    onSeen: ({ readAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderType === "USER" && !m.readAt ? { ...m, readAt } : m,
        ),
      );
    },
  });

  return (
    <div className="flex h-full min-h-0 flex-col justify-between py-4 overflow-hidden bg-background">
      <div className="shrink-0">
        <ChatHeader
          title={isBot ? "NexaMart Assistant" : (agentName ?? "Support Agent")}
          subtitle={isBot ? "AI Moderator" : "Human Support"}
          online={isBot ? true : online}
          lastSeenAt={isBot ? null : lastSeenAt}
          showMenuButton
          onMenuToggle={onOpenMenu}
        />
      </div>

      <MessageList messages={messages} typing={typing} />

      <div className="shrink-0">
        <ChatInput
          conversationId={conversationId}
          onPreviewUpdate={onPreviewUpdate}
        />
      </div>
    </div>
  );
}
