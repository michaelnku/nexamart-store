"use client";

import { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MessageStatus } from "./MessageStatus";

type Props = {
  message: ChatMessage;
};

export default function MessageBubble({ message }: Props) {
  const isUser = message.senderType === "USER";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-xl px-4 py-2 text-sm shadow-sm",
          isUser
            ? "bg-[var(--brand-blue)] text-white"
            : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {isUser && (
            <MessageStatus
              deliveredAt={message.deliveredAt}
              readAt={message.readAt}
              sent
            />
          )}
        </div>
      </div>
    </div>
  );
}
