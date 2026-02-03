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

  initialMessages: ChatMessage[];
};

export default function ChatBox({
  conversationId,

  initialMessages,
  agentId,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const { online, typing } = useConversationPresence(conversationId);

  const isBot = !agentId;

  useConversationMessages({
    conversationId,
    onMessage: (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="shrink-0">
        <ChatHeader
          title={isBot ? "NexaMart Assistant" : "Support Agent"}
          subtitle={isBot ? "AI Moderator" : "Human Support"}
          online={isBot ? true : online}
        />
      </div>

      <MessageList messages={messages} typing={typing} />

      <ChatInput conversationId={conversationId} />
    </div>
  );
}
