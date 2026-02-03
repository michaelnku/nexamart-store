"use client";

import { InboxPreview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MdDelete } from "react-icons/md";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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

  useEffect(() => {
    router.refresh();
  }, [conversations]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 border-b p-3">
        <Button size="sm" className="w-full" onClick={onNew}>
          + New conversation
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {conversations.map((c) => (
          <div
            key={c.id}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 hover:bg-muted",
              activeId === c.id && "bg-muted",
            )}
          >
            <button
              onClick={() => onSelect(c.id)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="truncate font-medium">{c.subject ?? "Support"}</p>
              {c.lastMessage && (
                <p className="truncate text-xs text-muted-foreground">
                  {c.lastMessage.content}
                </p>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50/60"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const res = await clearAllConversationsAction();
              if (!res?.error) onClearAll();
            });
          }}
        >
          <MdDelete className="h-5 w-5" />
          Clear all
        </Button>
      </div>
    </div>
  );
}
