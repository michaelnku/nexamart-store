"use client";

import { useEffect, useState } from "react";
import ChatBox from "./ChatBox";
import { ChatMessage } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";

export default function ChatMessages({
  conversationId,
  agentId,
  agentName,
  selfUserId,
  onOpenMenu,
  onPreviewUpdate,
}: {
  conversationId: string;
  agentId?: string | null;
  agentName?: string | null;
  selfUserId?: string | null;
  onOpenMenu?: () => void;
  onPreviewUpdate?: (payload: {
    content: string;
    senderType: ChatMessage["senderType"];
    createdAt: string;
  }) => void;
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

  useEffect(() => {
    if (!conversationId) return;
    fetch("/api/messages/delivered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, targetSenderType: "SUPPORT" }),
    }).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    fetch("/api/messages/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, targetSenderType: "SUPPORT" }),
    }).catch(() => {});
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
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ChatBox
        conversationId={conversationId}
        initialMessages={messages}
        agentId={agentId}
        agentName={agentName}
        selfUserId={selfUserId}
        onOpenMenu={onOpenMenu}
        onPreviewUpdate={onPreviewUpdate}
      />
    </div>
  );
}
