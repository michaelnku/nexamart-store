"use server";

import { prisma } from "@/lib/prisma";
import { CurrentRole } from "@/lib/currentUser";

export async function createDeliveryForPaidOrderAction(orderId: string) {
  const role = await CurrentRole();
  if (!["ADMIN", "SYSTEM"].includes(role ?? "")) {
    return { error: "Forbidden" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      isPaid: true,
      delivery: { select: { id: true } },
      shippingFee: true,
      deliveryStreet: true,
      deliveryCity: true,
      deliveryState: true,
      deliveryCountry: true,
      deliveryPostal: true,
      distanceInMiles: true,
    },
  });

  if (!order) return { error: "Order not found" };
  if (!order.isPaid) return { error: "Order not paid" };
  if (order.delivery) return { error: "Delivery already exists" };

  const deliveryAddress = [
    order.deliveryStreet,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryCountry,
    order.deliveryPostal,
  ]
    .filter((part) => Boolean(part && part.trim()))
    .join(", ");

  await prisma.delivery.create({
    data: {
      orderId,
      status: "PENDING",
      fee: order.shippingFee,
      deliveryAddress,
      distance: order.distanceInMiles,
    },
  });

  return { success: true };
}
