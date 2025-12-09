"use client";

//import { pusherClient } from "@/lib/pusher"; fix any here
import { useEffect } from "react";
import { toast } from "sonner";

export function useDashboardEvents(
  userId: string | undefined,
  role: string | undefined,
  setHasNewAlert: (v: boolean) => void
) {
  useEffect(() => {
    if (!userId || !role) return;

    const userChannel = pusherClient.subscribe(`user-${userId}`);

    userChannel.bind("payment-success", (data: any) => {
      toast.success(`Payment received for Order #${data.orderId}`);
    });

    userChannel.bind("rider-assigned", () => {
      toast.info("Your rider has been assigned");
    });

    if (role === "SELLER") {
      const sellerChannel = pusherClient.subscribe(`seller-${userId}`);

      sellerChannel.bind("new-order", (data: any) => {
        toast.info(`New Order! Store: ${data.storeId}`);
        setHasNewAlert(true);
      });

      sellerChannel.bind("group-verified", () => {
        toast.success("Your package arrived at Nexamart Hub");
      });

      return () => {
        pusherClient.unsubscribe(`seller-${userId}`);
      };
    }

    return () => {
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId, role, setHasNewAlert]);
}
