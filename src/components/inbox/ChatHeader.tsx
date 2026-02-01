"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  online?: boolean;
};

export default function ChatHeader({ title, subtitle, online }: Props) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background">
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-muted text-sm font-medium">
            {subtitle?.charAt(0).toUpperCase() ?? "S"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p
            className={cn(
              "text-xs",
              online ? "text-green-600" : "text-muted-foreground",
            )}
          >
            {online ? "online" : "offline"}
          </p>
        </div>
      </div>
    </div>
  );
}
