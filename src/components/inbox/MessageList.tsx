"use client";

import { ChatMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { useRef, useEffect } from "react";

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
    <div className="min-h-0 overflow-y-auto px-4 py-3">
      <div className="flex flex-col-reverse space-y-reverse space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
