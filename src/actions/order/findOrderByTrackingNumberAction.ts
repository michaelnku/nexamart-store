"use server";

import { prisma } from "@/lib/prisma";

export async function findOrderByTrackingNumberAction(trackingNumber: string) {
  if (!trackingNumber || trackingNumber.length < 6) {
    return { error: "Invalid tracking number" };
  }

  const order = await prisma.order.findUnique({
    where: { trackingNumber },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
        },
      },
      delivery: {
        include: {
          rider: { select: { name: true, email: true } },
        },
      },
      orderTimelines: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return { error: "Tracking number not found" };
  }

  return {
    success: true,
    order: {
      id: order.id,
      trackingNumber: order.trackingNumber,
      status: order.status,
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      shippingFee: order.shippingFee,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),

      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          name: item.product.name,
          images: item.product.images.map((img) => ({
            imageUrl: img.imageUrl,
          })),
        },
      })),

      delivery: order.delivery
        ? {
            status: order.delivery.status,
            rider: order.delivery.rider
              ? {
                  name: order.delivery.rider.name,
                  email: order.delivery.rider.email,
                }
              : null,
          }
        : null,

      orderTimelines: order.orderTimelines.map((t) => ({
        id: t.id,
        status: t.status,
        message: t.message,
        createdAt: t.createdAt.toISOString(),
      })),
    },
  };
}
