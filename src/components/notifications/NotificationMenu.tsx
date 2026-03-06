"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDTO } from "@/lib/types";
import { getNotificationIcon } from "@/lib/notifications/getNotificationIcon";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function NotificationMenu() {
  const { data, isLoading } = useNotifications();

  const notifications: NotificationDTO[] = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className=" inline-flex items-center">
          <button
            className={`relative transition ${
              unread > 0 ? "bell-buzz bell-pulse" : ""
            }`}
          >
            <Bell
              className={`h-5 w-5 ${
                unread > 0 ? "stroke-blue-700" : "stroke-gray-400"
              }`}
            />

            {unread > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white rounded-full px-1">
                {unread}
              </span>
            )}
          </button>
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <DropdownMenuLabel className="px-4 py-2">
          Notifications
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {isLoading && (
          <div className="p-4 text-sm text-muted-foreground">
            Loading notifications...
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}

        {!isLoading &&
          notifications.slice(0, 5).map((n) => {
            const Icon = getNotificationIcon(n.type);

            return (
              <Link
                key={n.id}
                href={n.link ?? "/notifications"}
                className={`flex gap-3 px-4 py-3 border-b text-sm hover:bg-muted transition ${
                  !n.read ? "bg-blue-50" : ""
                }`}
              >
                <div className="mt-1">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="flex-1">
                  <p className="font-medium">{n.title}</p>

                  <p className="text-muted-foreground text-xs">{n.message}</p>
                </div>
              </Link>
            );
          })}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />

            <Link
              href="/notifications"
              className="block text-center p-3 text-sm text-[var(--brand-blue)] hover:underline"
            >
              View all notifications
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
