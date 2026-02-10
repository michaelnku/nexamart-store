import NotificationTemplate from "@/components/notifications/NotificationTemplate";
import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export default async function RiderNotificationsPage() {
  const userId = await CurrentUserId();
  if (!userId) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="max-w-4xl mx-auto py-6 px-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-gray-500">
          Updates about your deliveries and schedule.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="border dark:bg-neutral-950 rounded-xl shadow-sm p-8 text-center text-gray-500">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationTemplate
              key={notification.id}
              notification={{
                ...notification,
                createdAt: notification.createdAt.toISOString(),
              }}
              time={notification.createdAt.toLocaleString()}
            />
          ))}
        </div>
      )}
    </main>
  );
}
