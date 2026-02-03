"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { sendMessageAction } from "@/actions/inbox/sendMessageAction";

type Props = {
  conversationId: string;
};
export function ChatInput({ conversationId }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [text]);

  const send = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    await sendMessageAction({ conversationId, content: value });
  };

  return (
    <div className="border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="px-4 py-3">
        <div className="relative">
          <Textarea
            value={text}
            ref={ref}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="min-h-10 w-full resize-none max-h-40 overflow-y-auto rounded-md border px-3 py-2 pr-14 text-sm leading-6 focus:outline-none"
          />
          <Button
            onClick={send}
            className="absolute bottom-1.5 right-1.5 h-7 px-3 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/90"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

