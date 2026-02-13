import { prisma } from "@/lib/prisma";
import OrderTrackCard from "@/components/order/OrderTrackCard";
import { OrderTrackDTO } from "@/lib/types";

export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { trackingNumber: trackingNumber },
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
      <div className="min-h-full flex items-center justify-center">
        <p className="text-red-500">Tracking number not found.</p>
      </div>
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
