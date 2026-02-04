"use client";

import { ChatMessage } from "@/lib/types";
import { SenderType } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { MessageStatus } from "./MessageStatus";

type Props = {
  message: ChatMessage;
  viewerSenderType?: SenderType;
};

export default function MessageBubble({ message, viewerSenderType }: Props) {
  const selfType = viewerSenderType ?? "USER";
  const isUser = message.senderType === selfType;

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
          "shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
          isUser
            ? "bg-[rgba(60,158,224,0.14)] text-slate-900"
            : "bg-muted text-foreground",
        )}
      >
        {/* MESSAGE TEXT */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* META */}
        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
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
