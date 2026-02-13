"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { OrderStatus, Prisma } from "@/generated/prisma/client";

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
    select: {
      status: true,
      isPaid: true,
      userId: true,
      items: { select: { variantId: true, quantity: true } },
    },
  });

  if (!order) return { error: "Order not found" };

  const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["SHIPPED", "OUT_FOR_DELIVERY", "CANCELLED"],
    SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
    DELIVERED: ["COMPLETED", "RETURN_REQUESTED"],
    COMPLETED: ["COMPLETED"],
    RETURN_REQUESTED: ["RETURNED"],
    RETURNED: ["REFUNDED"],
    REFUNDED: ["REFUNDED"],
    CANCELLED: ["CANCELLED"],
  };

  if (!VALID_TRANSITIONS[order.status]?.includes(nextStatus)) {
    return { error: `Invalid transition from ${order.status} → ${nextStatus}` };
  }

  const operations: Prisma.PrismaPromise<unknown>[] = [
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
  ];

  if (nextStatus === "CANCELLED" && order.isPaid) {
    const variantQuantities = new Map<string, number>();
    for (const item of order.items) {
      if (!item.variantId) continue;
      const current = variantQuantities.get(item.variantId) ?? 0;
      variantQuantities.set(item.variantId, current + item.quantity);
    }

    for (const [variantId, quantity] of variantQuantities.entries()) {
      operations.push(
        prisma.productVariant.updateMany({
          where: { id: variantId },
          data: { stock: { increment: quantity } },
        }),
      );
    }
  }

  await prisma.$transaction(operations);

  return { success: true };
}

function defaultTimelineMessage(status: OrderStatus) {
  switch (status) {
    case "ACCEPTED":
      return "Seller accepted your order";
    case "SHIPPED":
      return "Order has been shipped";
    case "OUT_FOR_DELIVERY":
      return "Order is out for delivery";
    case "DELIVERED":
      return "Order delivered successfully";
    case "COMPLETED":
      return "Order completed";
    case "CANCELLED":
      return "Order was cancelled";
    case "RETURN_REQUESTED":
      return "Return requested";
    case "RETURNED":
      return "Order returned";
    case "REFUNDED":
      return "Refund issued";
    default:
      return "Order updated";
  }
}
