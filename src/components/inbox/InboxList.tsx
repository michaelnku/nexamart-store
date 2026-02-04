"use client";

import { InboxPreview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

type Props = {
  conversations: InboxPreview[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
};

export default function InboxList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDeleteConversation,
  onClearAll,
}: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [clearOpen, setClearOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const formatPreviewTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    router.refresh();
  }, [conversations]);

  return (
    <aside className="h-full min-h-0 flex flex-col bg-white dark:bg-background border-r">
      {/* HEADER */}
      <div className="px-4 py-3 border-b">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Support Inbox
        </h1>
      </div>

      {/* NEW CONVERSATION */}
      <div className="px-3 py-2 border-b">
        <Button
          size="sm"
          className="w-full bg-[#3c9ee0] hover:bg-[#3c9ee0]/90 text-white"
          onClick={onNew}
        >
          + New conversation
        </Button>
      </div>

      {/* LIST */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y">
        {conversations.map((c) => {
          const isActive = activeId === c.id;

          return (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-2 px-4 py-3 cursor-pointer transition",
                isActive
                  ? "bg-[#3c9ee0]/10 border-l-4 border-[#3c9ee0]"
                  : "hover:bg-gray-50 dark:hover:bg-gray-900",
              )}
            >
              <button
                onClick={() => onSelect(c.id)}
                className="flex-1 min-w-0 text-left"
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
                    {c.subject ?? "Support"}
                  </p>

                  <div className="flex items-center gap-2">
                    {c.unreadCount > 0 && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3c9ee0]/60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#3c9ee0]" />
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {mounted
                        ? formatPreviewTime(c.lastMessage?.createdAt)
                        : ""}
                    </span>
                  </div>
                </div>

                {c.lastMessage && (
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {c.lastMessage.senderType === "USER"
                        ? "You: "
                        : c.lastMessage.senderType === "SUPPORT"
                          ? "Agent: "
                          : "System: "}
                    </span>
                    {c.lastMessage.content}
                  </p>
                )}
              </button>

              {/* ACTIONS */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isPending && pendingId === c.id}
                    onClick={() => {
                      setPendingId(c.id);
                      startTransition(async () => {
                        const res = await deleteConversationAction(c.id);
                        if (!res?.error) onDeleteConversation(c.id);
                        setPendingId(null);
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* CLEAR ALL */}
      <div className="px-3 py-2 border-t">
        <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-center gap-2 text-red-500 hover:bg-red-50"
              disabled={isPending}
            >
              <MdDelete className="h-5 w-5" />
              Clear all conversations
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
              <AlertDialogDescription>
                This action permanently deletes all messages and tickets.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <Label>Type “CLEAR ALL” to confirm</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>

            {isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Clearing…
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    const res = await clearAllConversationsAction();
                    if (!res?.error) {
                      onClearAll();
                      setConfirmText("");
                      setClearOpen(false);
                    }
                  });
                }}
                disabled={confirmText !== "CLEAR ALL" || isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}
