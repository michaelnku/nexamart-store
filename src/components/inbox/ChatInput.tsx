"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { sendMessageAction } from "@/actions/inbox/sendMessageAction";

type Props = {
  conversationId: string;
};
export function ChatInput({ conversationId }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);

  const send = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    await sendMessageAction({ conversationId, content: value });
  };

  return (
    <div className="border-t bg-background px-4 py-3 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          ref={ref}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="flex-1 resize-none max-h-40 overflow-y-auto border rounded-md px-3 py-2 text-sm focus:outline-none"
        />
        <Button
          onClick={send}
          className="h-10 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/90"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
