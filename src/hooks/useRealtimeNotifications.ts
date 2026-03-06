"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { pusherClient } from "@/lib/pusher";

export function useRealtimeNotifications(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = pusherClient.subscribe(`notifications-${userId}`);

    channel.bind("new-notification", () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    });

    return () => {
      pusherClient.unsubscribe(`notifications-${userId}`);
    };
  }, [userId, queryClient]);
}
