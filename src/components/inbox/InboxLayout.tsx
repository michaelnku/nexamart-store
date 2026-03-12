"use client";

import { useMemo, useState } from "react";
import InboxList from "./InboxList";
import ChatMessages from "./ChatMessages";
import EmptyInboxState from "./EmptyInboxState";
import NewConversationModal from "./NewConversationModal";
import { InboxPreview } from "@/lib/types";
import { SenderType } from "@/generated/prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PresenceRole = "ADMIN" | "MODERATOR" | "SELLER" | "RIDER" | "USER";

type Props = {
  conversations: InboxPreview[];
  currentUserId: string;
  initialActiveId?: string | null;
};

function isIncomingPreview(
  payload: {
    senderId?: string | null;
    senderType: SenderType;
  },
  currentUserId: string,
) {
  if (payload.senderId) return payload.senderId !== currentUserId;
  return payload.senderType === "SUPPORT" || payload.senderType === "SYSTEM";
}

function getConversationTitle(conversation: InboxPreview) {
  if (conversation.type === "PRODUCT_INQUIRY") {
    return conversation.participantName ?? conversation.storeName ?? "Store";
  }

  if (conversation.agentId) {
    return conversation.agentName ?? "Support Agent";
  }

  return "NexaMart Assistant";
}

function getConversationSubtitle(conversation: InboxPreview) {
  if (conversation.type === "PRODUCT_INQUIRY") {
    const parts = ["Product inquiry"];
    if (conversation.productName) parts.push(conversation.productName);
    if (conversation.storeName) parts.push(conversation.storeName);
    return parts.join(" - ");
  }

  return conversation.agentId ? "Human Support" : "AI Moderator";
}

function getPresenceTargetRoles(conversation: InboxPreview) {
  if (
    conversation.type === "PRODUCT_INQUIRY" &&
    conversation.participantRole &&
    conversation.participantRole !== "SYSTEM"
  ) {
    return [conversation.participantRole] as PresenceRole[];
  }

  return ["ADMIN", "MODERATOR", "SELLER", "RIDER"] as PresenceRole[];
}

export default function InboxLayout({
  conversations,
  currentUserId,
  initialActiveId,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [list, setList] = useState(conversations);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId ?? null);
  const [open, setOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const hasConversations = list.length > 0;
  const active = useMemo(
    () => list.find((conversation) => conversation.id === activeId) ?? null,
    [activeId, list],
  );

  const updateConversationQuery = (conversationId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (conversationId) {
      params.set("conversation", conversationId);
    } else {
      params.delete("conversation");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handlePreviewUpdate = (payload: {
    conversationId: string;
    content: string;
    senderId?: string | null;
    senderType: SenderType;
    createdAt: string;
  }) => {
    setList((prev) => {
      const index = prev.findIndex((conversation) => conversation.id === payload.conversationId);
      if (index === -1) return prev;

      const current = prev[index];
      const nextUnread =
        isIncomingPreview(payload, currentUserId) && activeId !== payload.conversationId
          ? current.unreadCount + 1
          : activeId === payload.conversationId
            ? 0
            : current.unreadCount;

      const updated: InboxPreview = {
        ...current,
        unreadCount: nextUnread,
        lastMessage: {
          content: payload.content,
          senderId: payload.senderId ?? null,
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
      <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center border bg-background px-6">
        <EmptyInboxState onNewConversation={() => setOpen(true)} />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Support Ticket</DialogTitle>
            </DialogHeader>

            <NewConversationModal
              onClose={() => setOpen(false)}
              onCreated={(conversation) => {
                const createdConversation: InboxPreview = {
                  id: conversation.id,
                  type: "SUPPORT",
                  subject: conversation.subject,
                  unreadCount: 0,
                  canDelete: true,
                };

                setList([createdConversation]);
                setActiveId(conversation.id);
                updateConversationQuery(conversation.id);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <main className="mx-auto h-full min-h-0 w-full max-w-5xl overflow-hidden border bg-background">
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        <aside
          className={cn(
            "h-full min-h-0 overflow-hidden bg-background md:border-r",
            activeId && !mobileListOpen && "hidden md:block",
            mobileListOpen && "fixed inset-0 z-20 md:static md:inset-auto md:z-auto",
          )}
        >
          <InboxList
            conversations={list}
            activeId={activeId}
            currentUserId={currentUserId}
            onSelect={(id) => {
              setActiveId(id);
              setMobileListOpen(false);
              updateConversationQuery(id);
              setList((prev) =>
                prev.map((conversation) =>
                  conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation,
                ),
              );
            }}
            onNew={() => setOpen(true)}
            onDeleteConversation={(id) => {
              setList((prev) => prev.filter((conversation) => conversation.id !== id));
              const nextActiveId = activeId === id ? null : activeId;
              setActiveId(nextActiveId);
              updateConversationQuery(nextActiveId);
            }}
            onClearAll={() => {
              setList((prev) => prev.filter((conversation) => !conversation.canDelete));
              if (active?.canDelete) {
                setActiveId(null);
                updateConversationQuery(null);
              }
            }}
          />
        </aside>

        <main
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden",
            (!activeId || mobileListOpen) && "hidden md:flex",
          )}
        >
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <ChatMessages
              conversationId={active.id}
              selfUserId={currentUserId}
              title={getConversationTitle(active)}
              subtitle={getConversationSubtitle(active)}
              forceOnline={active.type === "SUPPORT" && !active.agentId}
              presenceTargetRoles={getPresenceTargetRoles(active)}
              onOpenMenu={() => setMobileListOpen(true)}
              onPreviewUpdate={(payload) =>
                handlePreviewUpdate({ conversationId: active.id, ...payload })
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
              onCreated={(conversation) => {
                const createdConversation: InboxPreview = {
                  id: conversation.id,
                  type: "SUPPORT",
                  subject: conversation.subject,
                  unreadCount: 0,
                  canDelete: true,
                };

                setList((prev) => [createdConversation, ...prev]);
                setActiveId(conversation.id);
                updateConversationQuery(conversation.id);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
