"use client";

import { useEffect, useState } from "react";
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
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border bg-background px-5 py-4 shadow-sm">
          <Spinner className="h-5 w-5 text-[var(--brand-blue)] animate-spin" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading conversation…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ChatBox
        conversationId={conversationId}
        header={header}
        initialMessages={messages}
      />
    </div>
  );
}
