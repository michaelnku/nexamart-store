"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { NotificationDTO } from "@/lib/types";

export default function NotificationListener({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`notifications-${userId}`);

    channel.bind("new-notification", (notification: Partial<NotificationDTO>) => {
      const title = notification.title?.trim();
      const message = notification.message?.trim();

      if (!title && !message) {
        return;
      }

      toast(title ?? "New notification", {
        description: message,
        duration: 5000,
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [userId]);

  return null;
}
