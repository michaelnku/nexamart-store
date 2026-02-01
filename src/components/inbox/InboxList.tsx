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
    <aside className="w-[320px] flex flex-col border-r bg-background">
      <div className="p-3 border-b">
        <Button size="sm" className="w-full">
          + New conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((c) => {
          const isActive = activeId === c.id;

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "relative w-full px-4 py-3 text-left transition-colors",
                "hover:bg-[color:color-mix(in_oklab,var(--brand-blue)_6%,transparent)]",
                isActive &&
                  "bg-[color:color-mix(in_oklab,var(--brand-blue)_10%,transparent)]",
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-[var(--brand-blue)]" />
              )}

              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-sm",
                    isActive
                      ? "font-semibold text-[var(--brand-blue)]"
                      : "font-medium text-foreground",
                  )}
                >
                  {c.subject ?? "Support"}
                </p>

                {c.unreadCount > 0 && (
                  <span
                    className={cn(
                      "min-w-[20px] rounded-full px-2 py-0.5 text-xs font-medium",
                      isActive
                        ? "bg-[var(--brand-blue)] text-white"
                        : "bg-[var(--brand-blue)]/15 text-[var(--brand-blue)]",
                    )}
                  >
                    {c.unreadCount}
                  </span>
                )}
              </div>

              {c.lastMessage && (
                <p
                  className={cn(
                    "mt-1 truncate text-xs",
                    isActive ? "text-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {c.lastMessage.content}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
