"use client";

import { ChatMessage } from "@/lib/types";
import { SenderType } from "@/generated/prisma/client";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { useRef, useEffect } from "react";

type Props = {
  messages: ChatMessage[];
  typing?: boolean;
  viewerSenderType?: SenderType;
};

export default function MessageList({
  messages,
  typing,
  viewerSenderType,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);
  return (
    <main className="flex-1 min-h-0 overflow-y-auto" ref={listRef}>
      <div className="px-4 py-3">
        <div className="flex flex-col space-y-3">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              viewerSenderType={viewerSenderType}
            />
          ))}

          {typing && <TypingIndicator />}
        </div>
      </div>
    </main>
  );
}
