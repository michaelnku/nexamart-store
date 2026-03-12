"use client";

import { InboxPreview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useEffect, useState, useTransition } from "react";
import { MdDelete } from "react-icons/md";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { deleteConversationAction } from "@/actions/inbox/deleteConversationAction";
import { clearAllConversationsAction } from "@/actions/inbox/clearAllConversationsAction";
import { toast } from "sonner";

type Props = {
  conversations: InboxPreview[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
};

function getConversationTitle(conversation: InboxPreview) {
  if (conversation.type === "PRODUCT_INQUIRY") {
    return conversation.productName ?? conversation.subject ?? "Product inquiry";
  }

  return conversation.subject ?? "Support";
}

function getConversationMeta(conversation: InboxPreview) {
  if (conversation.type === "PRODUCT_INQUIRY") {
    return conversation.storeName
      ? `Product inquiry - ${conversation.storeName}`
      : "Product inquiry";
  }

  return conversation.agentName ? `Assigned to ${conversation.agentName}` : "Support ticket";
}

function getPreviewPrefix(conversation: InboxPreview, currentUserId: string) {
  const lastMessage = conversation.lastMessage;
  if (!lastMessage) return "";
  if (lastMessage.senderId && lastMessage.senderId === currentUserId) return "You: ";
  if (lastMessage.senderType === "SUPPORT") return "Agent: ";
  if (lastMessage.senderType === "SYSTEM") return "System: ";
  if (conversation.type === "PRODUCT_INQUIRY") {
    return `${conversation.participantName ?? "Store"}: `;
  }
  return "Reply: ";
}

export default function InboxList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onNew,
  onDeleteConversation,
  onClearAll,
}: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [clearOpen, setClearOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [mounted, setMounted] = useState(false);

  const deletableCount = conversations.filter((conversation) => conversation.canDelete).length;

  useEffect(() => setMounted(true), []);

  const formatPreviewTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  return (
    <aside className="flex h-full min-h-0 flex-col border-r bg-white dark:bg-background">
      <div className="border-b px-4 py-3">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Inbox
        </h1>
      </div>

      <div className="border-b px-3 py-2">
        <Button
          size="sm"
          className="w-full bg-[#3c9ee0] text-white hover:bg-[#3c9ee0]/90"
          onClick={onNew}
        >
          + New support conversation
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto divide-y">
        {conversations.map((conversation) => {
          const isActive = activeId === conversation.id;

          return (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-2 px-4 py-3 transition",
                isActive
                  ? "border-l-4 border-[#3c9ee0] bg-[#3c9ee0]/10"
                  : "hover:bg-gray-50 dark:hover:bg-gray-900",
              )}
            >
              <button
                onClick={() => onSelect(conversation.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      isActive
                        ? "font-semibold text-[#3c9ee0]"
                        : "font-medium text-gray-900 dark:text-gray-100",
                    )}
                  >
                    {getConversationTitle(conversation)}
                  </p>

                  <div className="flex items-center gap-2">
                    {conversation.unreadCount > 0 && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3c9ee0]/60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#3c9ee0]" />
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {mounted ? formatPreviewTime(conversation.lastMessage?.createdAt) : ""}
                    </span>
                  </div>
                </div>

                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {getConversationMeta(conversation)}
                </p>

                {conversation.lastMessage && (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {getPreviewPrefix(conversation, currentUserId)}
                    </span>
                    {conversation.lastMessage.content}
                  </p>
                )}
              </button>

              {conversation.canDelete ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={isPending && pendingId === conversation.id}
                      onClick={() => {
                        setPendingId(conversation.id);
                        startTransition(async () => {
                          const res = await deleteConversationAction(conversation.id);
                          if (res?.error) {
                            toast.error(res.error);
                          } else {
                            onDeleteConversation(conversation.id);
                          }
                          setPendingId(null);
                        });
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          );
        })}
      </div>

      {deletableCount > 0 ? (
        <div className="border-t px-3 py-2">
          <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-center gap-2 text-red-500 hover:bg-red-50"
                disabled={isPending}
              >
                <MdDelete className="h-5 w-5" />
                Clear deletable conversations
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear deletable conversations?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes support and single-member threads only. Shared buyer-seller
                  conversations stay intact.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-2">
                <Label>Type "CLEAR ALL" to confirm</Label>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
              </div>

              {isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Clearing...
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    startTransition(async () => {
                      const res = await clearAllConversationsAction();
                      if (res?.error) {
                        toast.error(res.error);
                        return;
                      }

                      onClearAll();
                      setConfirmText("");
                      setClearOpen(false);
                    });
                  }}
                  disabled={confirmText !== "CLEAR ALL" || isPending}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </aside>
  );
}
