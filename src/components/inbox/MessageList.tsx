"use client";

import { ChatMessage } from "@/lib/types";
import { SenderType } from "@/generated/prisma/client";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { useRef, useEffect, useMemo, useState } from "react";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef(new Set(messages.map((m) => m.id)));
  const [newCount, setNewCount] = useState(0);
  const selfType = viewerSenderType ?? "USER";

  const isAtBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    const threshold = 32;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const formatDateLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const sentTodaymd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    const today = sentTodaymd(now);
    const dayInMs = 86_400_000;
    const yesterday = sentTodaymd(new Date(now.getTime() - dayInMs));
    const current = sentTodaymd(date);
    if (current === today) return "Today";
    if (current === yesterday) return "Yesterday";
    return current;
  };

  const items = useMemo(() => {
    const out: Array<
      | { type: "date"; key: string; label: string }
      | { type: "msg"; key: string; message: ChatMessage }
    > = [];
    let lastLabel = "";
    for (const m of messages) {
      const label = formatDateLabel(m.createdAt);
      if (label && label !== lastLabel) {
        out.push({ type: "date", key: `date-${label}`, label });
        lastLabel = label;
      }
      out.push({ type: "msg", key: m.id, message: m });
    }
    return out;
  }, [messages]);

  useEffect(() => {
    if (isAtBottom()) {
      scrollToBottom("smooth");
      queueMicrotask(() => setNewCount(0));
    } else {
      const knownIds = knownIdsRef.current;
      const incomingCount = messages.reduce((count, message) => {
        if (knownIds.has(message.id)) return count;
        return message.senderType !== selfType ? count + 1 : count;
      }, 0);

      if (incomingCount > 0) {
        queueMicrotask(() =>
          setNewCount((count) => count + incomingCount),
        );
      }
    }

    knownIdsRef.current = new Set(messages.map((message) => message.id));
  }, [messages, selfType]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (isAtBottom()) {
        setNewCount(0);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <main className="relative flex-1 min-h-0 overflow-y-auto" ref={listRef}>
      <div className="px-4 pt-3 pb-2">
        <div className="flex flex-col space-y-3">
          {items.map((item) =>
            item.type === "date" ? (
              <div
                key={item.key}
                className="self-center rounded-full border bg-background px-3 py-1 text-[11px] text-muted-foreground"
              >
                {item.label}
              </div>
            ) : (
              <MessageBubble
                key={item.key}
                message={item.message}
                viewerSenderType={viewerSenderType}
              />
            ),
          )}

          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {newCount > 0 && (
        <div className="sticky bottom-3 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="rounded-full bg-[var(--brand-blue)] px-3 py-1 text-xs font-medium text-white shadow-md"
          >
            {newCount} new message{newCount > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </main>
  );
}
