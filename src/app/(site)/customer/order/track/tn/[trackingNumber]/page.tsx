// app/track/tn/[trackingNumber]/page.tsx

import { prisma } from "@/lib/prisma";
import OrderTrackCard from "@/components/order/OrderTrackCard";
import { OrderTrackDTO } from "@/lib/types";

export default async function PublicTrackPage({
  params,
}: {
  params: { trackingNumber: string };
}) {
  const order = await prisma.order.findUnique({
    where: { trackingNumber: params.trackingNumber },
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Tracking number not found.</p>
      </div>
    );
  }

  const orderDTO: OrderTrackDTO = {
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
  };

  return <OrderTrackCard order={orderDTO} />;
}
