"use client";

import { useState } from "react";
import InboxList from "./InboxList";
import ChatMessages from "./ChatMessages";
import EmptyInboxState from "./EmptyInboxState";
import NewConversationModal from "./NewConversationModal";
import { InboxPreview } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
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

  if (!hasConversations) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <EmptyInboxState onNewConversation={() => setOpen(true)} />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Support Ticket</DialogTitle>
            </DialogHeader>

            <NewConversationModal
              onClose={() => setOpen(false)}
              onCreated={(conv) => {
                setList([
                  { id: conv.id, subject: conv.subject, unreadCount: 0 },
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

  return (
    <main className="h-[100dvh] pt-1 pb-10 w-full mx-auto max-w-6xl bg-background  overflow-hidden">
      <div className="grid h-full min-h-0 grid-cols-[320px_1fr] overflow-hidden">
        <aside
          className={cn(
            "border-r h-full min-h-0 overflow-hidden",
            activeId && "hidden md:block",
          )}
        >
          <InboxList
            conversations={list}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={() => setOpen(true)}
          />
        </aside>

        <main className="h-full min-h-0 flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <ChatMessages conversationId={active.id} />
          )}
        </main>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Support Ticket</DialogTitle>
            </DialogHeader>

            <NewConversationModal
              onClose={() => setOpen(false)}
              onCreated={(conv) => {
                setList((prev) => [
                  { id: conv.id, subject: conv.subject, unreadCount: 0 },
                  ...prev,
                ]);
                setActiveId(conv.id);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
