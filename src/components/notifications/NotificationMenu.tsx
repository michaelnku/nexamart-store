"use client";

import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDTO } from "@/lib/types";
import { getNotificationIcon } from "@/lib/notifications/getNotificationIcon";
import { cn } from "@/lib/utils";
import { markNotificationRead } from "@/actions/notifications/markNotificationRead";
import { IconCountBadge } from "@/components/ui/icon-count-badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, "day");
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatNotificationType(type: string) {
  return type.replaceAll("_", " ");
}

export default function NotificationMenu() {
  const { data, isLoading } = useNotifications();
  const router = useRouter();
  const queryClient = useQueryClient();
  const notifications: NotificationDTO[] = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;
  const previewNotifications = notifications.slice(0, 6);

  const handleNotificationClick = async (notification: NotificationDTO) => {
    await markNotificationRead(notification.id);

    queryClient.invalidateQueries({
      queryKey: ["notifications"],
    });
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="inline-flex items-center">
          <button
            type="button"
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
            className={cn(
              "relative transition",
              unread > 0 && "bell-buzz bell-pulse",
            )}
          >
            <IconCountBadge count={unread}>
              <Bell
                className={cn(
                  "h-5 w-5",
                  unread > 0
                    ? "stroke-blue-700 dark:stroke-[var(--brand-blue)]"
                    : "stroke-gray-400 dark:stroke-zinc-500",
                )}
              />
            </IconCountBadge>
          </button>
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(26rem,calc(100vw-1rem))] rounded-[24px] border border-slate-200/80 bg-white/95 p-0 shadow-[0_32px_90px_-42px_rgba(15,23,42,0.55)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:w-[24rem] md:w-[26rem]"
      >
        <DropdownMenuLabel className="relative overflow-hidden border-b border-[var(--brand-blue)]/20 bg-[linear-gradient(135deg,rgba(60,158,224,0.28)_0%,rgba(60,158,224,0.14)_40%,rgba(255,255,255,0.98)_100%)] px-5 py-4 text-slate-900 shadow-[inset_0_-1px_0_rgba(60,158,224,0.14)] dark:border-[var(--brand-blue)]/25 dark:bg-[linear-gradient(135deg,rgba(12,24,38,0.98)_0%,rgba(16,35,56,0.98)_45%,rgba(13,20,32,0.98)_100%)] dark:text-white dark:shadow-[inset_0_-1px_0_rgba(60,158,224,0.18)] sm:px-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(60,158,224,0.2)_0%,var(--brand-blue)_50%,rgba(60,158,224,0.2)_100%)] dark:bg-[linear-gradient(90deg,rgba(60,158,224,0.12)_0%,var(--brand-blue)_50%,rgba(60,158,224,0.12)_100%)]" />
          <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-[var(--brand-blue)]/16 blur-3xl dark:bg-[var(--brand-blue)]/18" />
          <div className="absolute right-0 top-0 h-full w-32 bg-[radial-gradient(circle_at_top_right,_rgba(60,158,224,0.18),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(60,158,224,0.14),_transparent_72%)]" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-blue)] dark:text-sky-300">
                Inbox
              </p>
              <p className="text-base font-semibold tracking-tight text-slate-950 dark:text-white sm:text-lg">
                Notifications
              </p>
              <p className="text-xs text-slate-700/90 dark:text-slate-300/85 sm:text-sm">
                Track orders, payments, delivery, and marketplace updates.
              </p>
            </div>

            <span className="inline-flex shrink-0 rounded-full border border-[var(--brand-blue)]/20 bg-white/92 px-3 py-1 text-xs font-semibold text-[var(--brand-blue)] shadow-[0_10px_24px_-18px_rgba(60,158,224,0.8)] backdrop-blur dark:border-[var(--brand-blue)]/25 dark:bg-white/8 dark:text-sky-200 dark:shadow-[0_12px_28px_-20px_rgba(60,158,224,0.7)]">
              {unread} unread
            </span>
          </div>
        </DropdownMenuLabel>

        <div className="max-h-[min(24rem,60vh)]  overflow-y-auto p-2 sm:p-3">
          {isLoading && (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
              Loading notifications...
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
                <Bell className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                No notifications yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground dark:text-zinc-400">
                New marketplace activity will show up here.
              </p>
            </div>
          )}

          {!isLoading &&
            previewNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);

              return (
                <DropdownMenuItem
                  key={notification.id}
                  onSelect={() => handleNotificationClick(notification)}
                  className={cn(
                    "group mb-2 flex items-start gap-3 rounded-[20px] border border-transparent px-3 py-3.5 text-sm transition duration-200 last:mb-0 focus:bg-slate-50 dark:focus:bg-zinc-900 sm:px-4",
                    !notification.read
                      ? "bg-sky-50/80 shadow-[0_18px_45px_-38px_rgba(14,165,233,0.45)] hover:border-sky-100 dark:border-[var(--brand-blue)]/10 dark:bg-[var(--brand-blue)]/10 dark:shadow-[0_18px_45px_-38px_rgba(60,158,224,0.35)] dark:hover:border-[var(--brand-blue)]/25 dark:hover:bg-[var(--brand-blue)]/12"
                      : "bg-transparent hover:border-slate-200 hover:bg-slate-50/80 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
                      !notification.read
                        ? "border-sky-200 bg-white text-sky-700 dark:border-[var(--brand-blue)]/20 dark:bg-zinc-950 dark:text-sky-300"
                        : "border-slate-200 bg-white text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-1 font-semibold tracking-tight text-slate-900 dark:text-white">
                        {notification.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                        )}
                        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-400">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    {notification.message ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-zinc-400 sm:text-[13px]">
                        {notification.message}
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-400">
                        {formatNotificationType(notification.type)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 transition group-hover:translate-x-0.5 dark:text-sky-300">
                        Open
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="mx-0 my-0" />

            <Link
              href="/notifications"
              className="flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-900 sm:px-6"
            >
              <span>View all notifications</span>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
