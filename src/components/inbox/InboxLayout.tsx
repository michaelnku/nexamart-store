"use client";

import { useState } from "react";
import InboxList from "./InboxList";
import EmptyInboxState from "./EmptyInboxState";
import NewConversationModal from "./NewConversationModal";
import { InboxPreview } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ChatMessages from "./ChatMessages";

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
    <div className="grid grid-cols-[320px_1fr] h-screen  border rounded-xl overflow-hidden bg-background">
      <InboxList
        conversations={list}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={() => setOpen(true)}
      />

      <div className=" flex flex-col justify-center items-center">
        {!hasConversations ? (
          <EmptyInboxState onNewConversation={() => setOpen(true)} />
        ) : !active ? (
          <div className="text-center text-gray-500">
            Select a conversation to start chatting
          </div>
        ) : (
          <ChatMessages
            conversationId={active.id}
            header={{
              title: active.subject ?? "Support",
              subtitle: "Support Agent",
              status: "online",
            }}
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
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
