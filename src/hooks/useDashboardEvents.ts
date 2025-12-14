"use client";

import { pusherClient } from "@/lib/pusher";
import { useEffect } from "react";
import { toast } from "sonner";

type PaymentSuccessEvent = {
  orderId: string;
};

type NewOrderEvent = {
  storeId: string;
};

export function useDashboardEvents(
  userId: string | undefined,
  role: string | undefined,
  setHasNewAlert: (v: boolean) => void
) {
  useEffect(() => {
    if (!userId || !role) return;

    const userChannelName = `user-${userId}`;
    const sellerChannelName = `seller-${userId}`;

    const userChannel = pusherClient.subscribe(userChannelName);

    userChannel.bind("payment-success", (data: PaymentSuccessEvent) => {
      toast.success(`Payment received for Order #${data.orderId}`);
    });

    userChannel.bind("rider-assigned", () => {
      toast.info("Your rider has been assigned");
    });

    if (role === "SELLER") {
      const sellerChannel = pusherClient.subscribe(sellerChannelName);

      sellerChannel.bind("new-order", (data: NewOrderEvent) => {
        toast.info(`New Order! Store: ${data.storeId}`);
        setHasNewAlert(true);
      });

      sellerChannel.bind("group-verified", () => {
        toast.success("Your package arrived at Nexamart Hub");
      });

      return () => {
        pusherClient.unsubscribe(sellerChannelName);
        pusherClient.unsubscribe(userChannelName);
      };
    }

    return () => {
      pusherClient.unsubscribe(userChannelName);
    };
  }, [userId, role, setHasNewAlert]);
}
