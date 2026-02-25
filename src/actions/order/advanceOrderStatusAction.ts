"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { assertValidTransition, normalizeOrderStatus } from "@/lib/order/orderLifecycle";

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

  const normalizedCurrent = normalizeOrderStatus(order.status);
  try {
    assertValidTransition(normalizedCurrent, nextStatus);
  } catch {
    return {
      error: `Invalid transition from ${normalizedCurrent} -> ${nextStatus}`,
    };
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

  if (
    nextStatus === "CANCELLED" &&
    order.isPaid &&
    ["READY", "IN_DELIVERY", "DELIVERED", "COMPLETED"].includes(
      order.status as string,
    )
  ) {
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
    case "PENDING_PAYMENT":
      return "Order created and awaiting payment";
    case "PAID":
      return "Payment confirmed";
    case "ACCEPTED":
      return "Seller accepted your order";
    case "PREPARING":
      return "Order is being prepared";
    case "READY":
      return "Order is ready for pickup";
    case "IN_DELIVERY":
      return "Order is in delivery";
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
