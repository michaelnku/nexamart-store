"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  online?: boolean;
  lastSeenAt?: Date | string | null;
  showMenuButton?: boolean;
  onMenuToggle?: () => void;
};

export default function ChatHeader({
  title,
  subtitle,
  online,
  lastSeenAt,
  showMenuButton,
  onMenuToggle,
}: Props) {
  const lastSeenText = (() => {
    if (!lastSeenAt) return "offline";
    const date =
      typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
    if (Number.isNaN(date.getTime())) return "offline";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs >= 0 && diffMs < 60_000) return "last seen just now";
    if (diffMs >= 60_000 && diffMs < 3_600_000) {
      const mins = Math.floor(diffMs / 60_000);
      return `last seen ${mins}m ago`;
    }

    const toUtcYmd = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate(),
      ).padStart(2, "0")}`;

    const formatTimeUtc = (d: Date) => {
      const hours = String(d.getUTCHours()).padStart(2, "0");
      const minutes = String(d.getUTCMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    };

    const todayUtc = toUtcYmd(now);
    const dateUtc = toUtcYmd(date);
    const yesterdayUtc = toUtcYmd(new Date(now.getTime() - 86_400_000));

    if (dateUtc === todayUtc) {
      return `last seen today at ${formatTimeUtc(date)}`;
    }
    if (dateUtc === yesterdayUtc) {
      return `last seen yesterday at ${formatTimeUtc(date)}`;
    }
    return `last seen ${dateUtc} at ${formatTimeUtc(date)}`;
  })();

  return (
    <div className="sticky top-0 z-10 border-b bg-background">
      <div className="flex items-center gap-3 px-4 py-1">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Open conversations"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
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
            {online ? "online" : lastSeenText}
          </p>
        </div>
      </div>
    </div>
  );
}
