"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Props = {
  title: string;
  subtitle?: string;
  status?: "online" | "offline";
};

export default function ChatHeader({ title, subtitle, status }: Props) {
  return (
    <div className="sticky top-0 z-10 border-b bg-background flex flex-col gap-3">
      <div className="border-b px-4 py-3">
        <p className="font-medium truncate">{title}</p>
      </div>
      <span className="px-2  flex gap-3">
        <Avatar>
          <AvatarFallback>{subtitle?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="flex-1 min-w-0 pb-2 space-y-1">
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
          {status && (
            <Badge
              variant="outline"
              className={
                status === "online"
                  ? "text-green-600 text-xs"
                  : "text-gray-400 text-xs"
              }
            >
              {status}
            </Badge>
          )}
        </span>
      </span>
    </div>
  );
}
