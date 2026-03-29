import "server-only";

import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { createNotification } from "@/lib/notifications/createNotification";
import { createSellerOrderNotification } from "@/lib/notifications/createSellerOrderNotification";
import type { CreatedOrdersPayload, StoreGroup } from "./placeOrder.types";

export async function runPostOrderNotifications({
  userId,
  createdOrders,
  storeGroups,
}: {
  userId: string;
  createdOrders: CreatedOrdersPayload;
  storeGroups: StoreGroup[];
}) {
  await prisma.orderTimeline.createMany({
    data: createdOrders.map((order) => ({
      orderId: order.id,
      status: "PENDING_PAYMENT",
      message: "Order placed successfully",
    })),
  });

  await createNotification({
    userId,
    title: "Order Confirmed",
    message:
      createdOrders.length > 1
        ? `Your ${createdOrders.length} orders were placed successfully`
        : `Your order ${createdOrders[0]?.trackingNumber ?? ""} was placed successfully`,
    link: `/customer/order/${createdOrders[0]?.id}`,
    event: "ORDER_CREATED",
    key: `order-confirm-${createdOrders[0]?.id}-${userId}`,
  });

  const uniqueSellerIds = [...new Set(storeGroups.map((g) => g.sellerId))];

  for (const sellerId of uniqueSellerIds) {
    await createSellerOrderNotification(sellerId, createdOrders[0]?.id);
  }

  await Promise.all([
    pusherServer.trigger(`notifications-${userId}`, "new-notification", {
      title: "Order Confirmed",
      message:
        createdOrders.length > 1
          ? `Your ${createdOrders.length} orders were placed successfully`
          : `Your order ${createdOrders[0]?.trackingNumber ?? ""} was placed successfully`,
    }),

    ...uniqueSellerIds.map((sellerId) =>
      pusherServer.trigger(`notifications-${sellerId}`, "new-notification", {
        title: "New Orders",
        message: "You received a new order",
      }),
    ),
  ]);
}

