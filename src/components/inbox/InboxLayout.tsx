"use client";

import { useState } from "react";
import InboxList from "./InboxList";
import ChatMessages from "./ChatMessages";
import EmptyInboxState from "./EmptyInboxState";
import NewConversationModal from "./NewConversationModal";
import { InboxPreview } from "@/lib/types";
import { SenderType } from "@/generated/prisma/client";
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

  const handlePreviewUpdate = (payload: {
    conversationId: string;
    content: string;
    senderType: SenderType;
    createdAt: string;
  }) => {
    setList((prev) => {
      const index = prev.findIndex((c) => c.id === payload.conversationId);
      if (index === -1) return prev;

      const current = prev[index];
      const nextUnread =
        payload.senderType !== "USER" && activeId !== payload.conversationId
          ? current.unreadCount + 1
          : activeId === payload.conversationId
            ? 0
            : current.unreadCount;

      const updated: InboxPreview = {
        ...current,
        unreadCount: nextUnread,
        lastMessage: {
          content: payload.content,
          senderType: payload.senderType,
          createdAt: payload.createdAt,
        },
      };

      const next = [...prev];
      next.splice(index, 1);
      next.unshift(updated);
      return next;
    });
  };

  if (!hasConversations) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
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
    <main className="h-full min-h-0 w-full mx-auto max-w-6xl bg-background overflow-hidden">
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
            onSelect={(id) => {
              setActiveId(id);
              setList((prev) =>
                prev.map((c) =>
                  c.id === id ? { ...c, unreadCount: 0 } : c,
                ),
              );
            }}
            onNew={() => setOpen(true)}
          />
        </aside>

        <main className="h-full min-h-0 flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <ChatMessages
              conversationId={active.id}
              onPreviewUpdate={(p) =>
                handlePreviewUpdate({ conversationId: active.id, ...p })
              }
            />
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
