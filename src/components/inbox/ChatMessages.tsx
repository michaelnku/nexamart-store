"use client";

import { useEffect, useRef, useState } from "react";
import ChatBox from "./ChatBox";
import { ChatMessage } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";

export default function ChatMessages({
  conversationId,
  header,
}: {
  conversationId: string;
  header: {
    title: string;
    subtitle?: string;
    status?: "online" | "offline";
  };
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setMessages(null);

      const res = await fetch(`/api/inbox/conversation/${conversationId}`);
      const data = await res.json();

      if (!ignore) setMessages(data.messages);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [conversationId]);

  if (!messages) {
    return (
      <div className="flex w-full max-w-xs gap-4 [--radius:1rem] text-gray-500 items-center human:animate-pulse justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <ChatBox
        conversationId={conversationId}
        header={header}
        initialMessages={messages}
      />
      {/* <div ref={bottomRef} /> */}
    </>
  );
}
