"use client";

import { useState } from "react";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useConversationPresence } from "@/hooks/useConversationPresence";
import { ChatMessage } from "@/lib/types";
import ChatHeader from "@/components/inbox/ChatHeader";
import MessageList from "@/components/inbox/MessageList";
import AdminChatInput from "./AdminChatInput";

type Props = {
  conversationId: string;
  initialMessages: ChatMessage[];
  customerName?: string | null;
  canSend: boolean;
};

export default function AdminChatBox({
  conversationId,
  initialMessages,
  customerName,
  canSend,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const { online, typing } = useConversationPresence(conversationId, {
    targetRoles: ["USER"],
  });

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
    <div className="flex h-full  min-h-0 flex-col overflow-hidden bg-background">
      <div className="shrink-0">
        <ChatHeader
          title={customerName ?? "Customer"}
          subtitle="Support Ticket"
          online={online}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList
          messages={messages}
          typing={typing}
          viewerSenderType="SUPPORT"
        />
      </div>

      <div className="shrink-0">
        <AdminChatInput conversationId={conversationId} disabled={!canSend} />
      </div>
    </div>
  );
}
