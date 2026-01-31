"use client";

import { InboxPreview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type Props = {
  conversations: InboxPreview[];
  activeId: string | null;
  onSelect: (conversationId: string) => void;
  onNew: () => void;
};

export default function InboxList({
  conversations,
  activeId,
  onSelect,
  onNew,
}: Props) {
  return (
    <aside className="border-r overflow-y-auto flex flex-col">
      <div className="p-2">
        <Button size="sm" className="w-full" onClick={onNew}>
          + New conversation
        </Button>
      </div>

      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            "w-full p-4 text-left transition hover:bg-gray-50",
            activeId === c.id && "bg-gray-100",
          )}
        >
          <div className="flex justify-between items-center gap-2">
            <p className="font-medium truncate">{c.subject ?? "Support"}</p>

            {c.unreadCount > 0 && (
              <span className="rounded-full bg-[var(--brand-blue)] px-2 text-xs text-white">
                {c.unreadCount}
              </span>
            )}
          </div>

          {c.lastMessage && (
            <p className="text-xs text-gray-500 truncate mt-1">
              {c.lastMessage.content}
            </p>
          )}
        </button>
      ))}
    </aside>
  );
}
