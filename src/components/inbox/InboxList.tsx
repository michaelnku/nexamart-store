"use client";

import { InboxPreview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdDelete } from "react-icons/md";

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
  const router = useRouter();

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
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "w-full px-4 py-3 text-left hover:bg-muted",
              activeId === c.id && "bg-muted",
            )}
          >
            <p className="truncate font-medium">{c.subject ?? "Support"}</p>
            {c.lastMessage && (
              <p className="truncate text-xs text-muted-foreground">
                {c.lastMessage.content}
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="shrink-0">
        <Button variant={"ghost"} className="w-12 h-12">
          <MdDelete className="text-red-500" />
        </Button>
      </div>
    </div>
  );
}
