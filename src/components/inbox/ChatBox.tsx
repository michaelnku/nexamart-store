"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { sendMessageAction } from "@/actions/inbox/sendMessageAction";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import TypingIndicator from "./TypingIndicator";

type Props = {
  conversationId: string;
  header: {
    title: string;
    subtitle?: string;
    status?: "online" | "offline";
  };
  initialMessages: ChatMessage[];
};

export default function ChatBox({
  conversationId,
  header,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");

  useConversationMessages({
    conversationId,
    onMessage: (msg) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    },
  });

  const send = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    await sendMessageAction({ conversationId, content: value });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3">
        <p className="font-medium">{header.title}</p>
        {header.subtitle && (
          <p className="text-xs text-gray-500">{header.subtitle}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.senderType === "USER"
                ? "ml-auto bg-[var(--brand-blue)] text-white"
                : "bg-gray-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        <TypingIndicator />
      </div>

      <div className="border-t p-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
        />
        <Button onClick={send}>Send</Button>
      </div>
    </div>
  );
}
