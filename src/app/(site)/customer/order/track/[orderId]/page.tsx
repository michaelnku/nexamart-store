import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import Link from "next/link";

import OrderTrackCard from "@/components/order/OrderTrackCard";
import { OrderTrackDTO } from "@/lib/types";

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const userId = await CurrentUserId();

  if (!userId) {
    return (
      <main className="min-h-full flex items-center justify-center px-4">
        <p className="text-gray-600">
          Please{" "}
          <Link href="/login" className="text-blue-600 underline">
            login
          </Link>{" "}
          to view this order.
        </p>
      </main>
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
      delivery: {
        include: {
          rider: { select: { id: true, name: true, email: true } },
        },
      },
      orderTimelines: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return (
      <main className="min-h-full flex items-center justify-center px-4">
        <p className="text-red-500">Order not found or unauthorized.</p>
      </main>
    );
  }

  const deliveryAddress = [
    order.deliveryStreet,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryCountry,
    order.deliveryPostal,
  ]
    .filter((part) => Boolean(part && part.trim()))
    .join(", ");

  const orderDTO: OrderTrackDTO = {
    id: order.id,
    trackingNumber: order.trackingNumber,
    status: order.status,
    deliveryType: order.deliveryType,
    deliveryAddress,
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
  };

  return <OrderTrackCard order={orderDTO} />;
}
