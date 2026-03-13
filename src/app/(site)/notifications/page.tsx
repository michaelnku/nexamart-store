"use client";

import { useNotifications } from "@/hooks/useNotifications";
import NotificationTemplate from "@/components/notifications/NotificationTemplate";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationDTO } from "@/lib/types";

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!data?.notifications?.length) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8">
        <p className="text-lg font-semibold text-slate-950 dark:text-zinc-100">No notifications</p>
        <p className="text-sm text-muted-foreground">
          When activity happens on your account it will appear here.
        </p>
      </div>
    );
  }

  const notifications: NotificationDTO[] = data?.notifications ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <h1 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">Notification Center</h1>

      <span className="flex justify-center items-center">
        {data.notifications.length === 0 && (
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        )}
      </span>

      <div className="space-y-6">
        {notifications.map((notification) => (
          <NotificationTemplate
            key={notification.id}
            notification={notification}
            href={notification.link}
          />
        ))}
      </div>
    </div>
  );
}
