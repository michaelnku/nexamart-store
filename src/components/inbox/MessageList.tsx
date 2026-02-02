"use client";

import { ChatMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

type Props = {
  messages: ChatMessage[];
  typing?: boolean;
};

export default function MessageList({ messages, typing }: Props) {
  return (
    <div className="min-h-0 overflow-y-auto px-4 py-3">
      <div className="flex flex-col-reverse space-y-reverse space-y-3">
        {typing && <TypingIndicator />}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>
    </div>
  );
}
