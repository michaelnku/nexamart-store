import "server-only";

import { prisma } from "@/lib/prisma";

export async function loadOrderForAutoAssign(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      isPaid: true,
      status: true,
      delivery: { select: { id: true } },
    },
  });
}

export async function loadDeliveryForRiderAccept(deliveryId: string) {
  return prisma.delivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      riderId: true,
      status: true,
      orderId: true,
      order: { select: { status: true } },
    },
  });
}

export async function loadDeliveryForRiderCancel(deliveryId: string) {
  return prisma.delivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      riderId: true,
      status: true,
      orderId: true,
    },
  });
}

export async function loadDeliveryForOtpVerification(deliveryId: string) {
  return prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { order: true },
  });
}

