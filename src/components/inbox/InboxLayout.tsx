"use client";

import { useState } from "react";
import InboxList from "./InboxList";
import ChatBox from "./ChatBox";
import EmptyInboxState from "./EmptyInboxState";
import NewConversationModal from "./NewConversationModal";
import { InboxPreview, InboxConversation } from "@/lib/types";
import { Dialog, DialogContent } from "../ui/dialog";

type Props = {
  conversations: InboxPreview[];
};

export default function InboxLayout({ conversations }: Props) {
  const [list, setList] = useState(conversations);
  const [active, setActive] = useState<InboxConversation | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="grid grid-cols-[320px,1fr] h-full">
      <InboxList
        conversations={list}
        activeId={active?.id ?? null}
        onSelect={(id) => {
          setActive((prev) => (prev?.id === id ? prev : null));
        }}
        onNew={() => setOpen(true)}
      />

      {!active ? (
        <EmptyInboxState onNewConversation={() => setOpen(true)} />
      ) : (
        <ChatBox conversationId={active.id} initialMessages={active.messages} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
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

              setActive(conv);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
