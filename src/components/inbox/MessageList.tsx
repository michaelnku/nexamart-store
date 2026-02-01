"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

type Props = {
  messages: ChatMessage[];
  typing?: boolean;
};

export default function MessageList({ messages, typing }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}

      {typing && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
