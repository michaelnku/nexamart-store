"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { OrderStatus } from "@/generated/prisma/client";

type AdvanceOrderInput = {
  orderId: string;
  nextStatus: OrderStatus;
  message?: string;
};

export async function advanceOrderStatusAction({
  orderId,
  nextStatus,
  message,
}: AdvanceOrderInput) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, userId: true },
  });

  if (!order) return { error: "Order not found" };

  const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["DELIVERED", "CANCELLED"],
    DELIVERED: ["DELIVERED"],
    SHIPPED: ["SHIPPED"],
    CANCELLED: ["CANCELLED"],
    RETURNED: ["RETURNED"],
  };

  if (!VALID_TRANSITIONS[order.status]?.includes(nextStatus)) {
    return { error: `Invalid transition from ${order.status} → ${nextStatus}` };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    }),

    prisma.orderTimeline.create({
      data: {
        orderId,
        status: nextStatus,
        message: message ?? defaultTimelineMessage(nextStatus),
      },
    }),
  ]);

  return { success: true };
}

function defaultTimelineMessage(status: OrderStatus) {
  switch (status) {
    case "PROCESSING":
      return "Seller started preparing your order";
    case "IN_TRANSIT":
      return "Order is on the way";
    case "DELIVERED":
      return "Order delivered successfully";
    case "CANCELLED":
      return "Order was cancelled";
    default:
      return "Order updated";
  }
}
