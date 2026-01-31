"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessageAction } from "@/actions/inbox/sendMessageAction";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { ChatMessage } from "@/lib/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { markConversationReadAction } from "@/actions/inbox/markConversationReadAction";
import { sendTypingAction } from "@/actions/inbox/sendTypingAction";
import TypingIndicator from "./TypingIndicator";

export default function ChatBox({
  conversationId,
}: {
  conversationId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    markConversationReadAction(conversationId);
  }, [conversationId]);

  useConversationMessages({
    conversationId,
    onMessage: (msg) =>
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      ),
    onTyping: () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1500);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleTyping = () => {
    if (typingTimeout.current) return;
    sendTypingAction({ conversationId });
    typingTimeout.current = setTimeout(() => {
      typingTimeout.current = null;
    }, 1200);
  };

  const send = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    const res = await sendMessageAction({ conversationId, content: value });
    if (res?.error) setText(value);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-3 overflow-y-auto px-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.senderType === "USER"
                ? "ml-auto bg-[var(--brand-blue)] text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t p-2">
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a message…"
        />
        <Button onClick={send}>Send</Button>
      </div>
    </div>
  );
}
