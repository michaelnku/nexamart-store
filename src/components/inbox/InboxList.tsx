"use client";

import { InboxPreview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type Props = {
  conversations: InboxPreview[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
};

export default function InboxList({
  conversations,
  activeId,
  onSelect,
  onNew,
}: Props) {
  return (
    <aside className="w-[320px] border-r flex flex-col">
      {/* HEADER */}
      <div className="p-3 border-b">
        <Button size="sm" className="w-full" onClick={onNew}>
          + New conversation
        </Button>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "w-full px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800",
              activeId === c.id && "bg-gray-100 dark:bg-gray-800/50",
            )}
          >
            <div className="flex justify-between items-center">
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
      </div>
    </aside>
  );
}
