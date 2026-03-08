"use client";

import { useNotifications } from "@/hooks/useNotifications";
import NotificationTemplate from "@/components/notifications/NotificationTemplate";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationDTO } from "@/lib/types";

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto py-20 px-8">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!data?.notifications?.length) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col justify-center items-center py-20 ">
        <p className="text-lg font-semibold">No notifications</p>
        <p className="text-sm text-muted-foreground">
          When activity happens on your account it will appear here.
        </p>
      </div>
    );
  }

  const notifications: NotificationDTO[] = data?.notifications ?? [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-xl font-semibold">Notification Center</h1>

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
