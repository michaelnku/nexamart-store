"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { sendSupportMessageAction } from "@/actions/inbox/admin/sendSupportMessageAction";

type Props = {
  conversationId: string;
  disabled?: boolean;
};

export default function AdminChatInput({ conversationId, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [text]);

  const send = async () => {
    if (!text.trim() || isSending || disabled) return;
    const value = text;
    setText("");
    setIsSending(true);
    try {
      await sendSupportMessageAction({ conversationId, content: value });
    } finally {
      setIsSending(false);
    }
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
            placeholder={
              disabled ? "Assign this conversation to reply…" : "Type a reply…"
            }
            disabled={disabled}
            className="min-h-10 w-full resize-none max-h-40 overflow-y-auto rounded-md border px-3 py-2 pr-14 text-sm leading-6 focus:outline-none disabled:opacity-70"
          />
          <Button
            onClick={send}
            disabled={disabled || isSending}
            className="absolute bottom-1.5 right-1.5 h-7 px-3 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/90 disabled:opacity-70"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4 animate-spin text-white" />
              </span>
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
