"use client";

import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { sendMessageAction } from "@/actions/inbox/sendMessageAction";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useConversationPresence } from "@/hooks/useConversationPresence";
import { ChatMessage } from "@/lib/types";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";

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
  const [text, setText] = useState("");

  const { online, typing } = useConversationPresence(conversationId);

  const isBot = !agentId;

  useConversationMessages({
    conversationId,
    onMessage: (msg) =>
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      ),
  });

  const send = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    await sendMessageAction({ conversationId, content: value });
  };

  return (
    <div className="grid h-[100dvh] grid-rows-[auto_1fr_auto] bg-background">
      <div className="shrink-0">
        <ChatHeader
          title={isBot ? "NexaMart Assistant" : "Support Agent"}
          subtitle={isBot ? "AI Moderator" : "Human Support"}
          online={isBot ? true : online}
        />
      </div>

      <MessageList messages={messages} typing={typing} />

      <div className="shrink-0 border-t bg-background px-3 py-2">
        <div className="flex gap-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="h-10"
          />
          <Button
            onClick={send}
            className="h-10 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/90"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
