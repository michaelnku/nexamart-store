import { prisma } from "@/lib/prisma";
import TrackAllOrdersClient from "../../_component/TrackAllOrdersClient";

export default async function TrackAllActiveOrdersPage() {
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["PENDING", "PROCESSING", "IN_TRANSIT"],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
        },
      },
      orderTimelines: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const orderDTOs = orders.map((order) => ({
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

    orderTimelines: order.orderTimelines.map((t) => ({
      id: t.id,
      status: t.status,
      message: t.message,
      createdAt: t.createdAt.toISOString(),
    })),
  }));

  return <TrackAllOrdersClient orders={orderDTOs} />;
}
