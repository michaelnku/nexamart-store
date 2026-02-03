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
          <p className="truncate text-base font-semibold leading-tight">
            {title}
          </p>
          <p>
            <span className="text-muted-foreground text-sm">{subtitle}</span>
          </p>
          <p
            className={cn(
              "text-[11px]",
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
