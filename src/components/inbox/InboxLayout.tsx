"use client";

import { useState } from "react";
import InboxList from "./InboxList";
import EmptyInboxState from "./EmptyInboxState";
import NewConversationModal from "./NewConversationModal";
import { InboxPreview } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ChatMessages from "./ChatMessages";
import { cn } from "@/lib/utils";

type Props = {
  conversations: InboxPreview[];
};

export default function InboxLayout({ conversations }: Props) {
  const [list, setList] = useState(conversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const hasConversations = list.length > 0;
  const active = list.find((c) => c.id === activeId);

  return (
    <div
      className={cn(
        "grid h-screen border rounded-xl overflow-hidden bg-background",
        "grid-cols-1 md:grid-cols-[320px_1fr]",
      )}
    >
      {list.length > 0 && (
        <div className={cn("border-r", activeId && "hidden md:block")}>
          <InboxList
            conversations={list}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={() => setOpen(true)}
          />
        </div>
      )}

      <div
        className={cn("flex flex-col h-full", !activeId && "hidden md:flex")}
      >
        {!hasConversations ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyInboxState onNewConversation={() => setOpen(true)} />
          </div>
        ) : !active ? (
          <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
            Select a conversation to start chatting
          </div>
        ) : (
          <div>
            <ChatMessages
              conversationId={active.id}
              header={{
                title: active.subject ?? "Support",
                subtitle: "Support Agent",
                status: "online",
              }}
            />
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
          </DialogHeader>

          <NewConversationModal
            onClose={() => setOpen(false)}
            onCreated={(conv) => {
              setList((prev) => [
                {
                  id: conv.id,
                  subject: conv.subject,
                  unreadCount: 0,
                },
                ...prev,
              ]);
              setActiveId(conv.id);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
