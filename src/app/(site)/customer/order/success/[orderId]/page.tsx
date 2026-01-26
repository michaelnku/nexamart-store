import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import OrderSummaryCard from "@/components/order/OrderSummaryCard";
import { OrderSummaryDTO } from "@/lib/types";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const userId = await CurrentUserId();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
      delivery: true,
    },
  });

  if (!order)
    return (
      <p className="text-center text-red-500 py-40 min-h-screen">
        Order not found.
      </p>
    );

  if (order.userId !== userId)
    return (
      <p className="text-center text-red-500 py-40 min-h-screen">
        Unauthorized access.
      </p>
    );

  const orderDTO: OrderSummaryDTO = {
    id: order.id,
    deliveryType: order.deliveryType,
    totalAmount: order.totalAmount,
    shippingFee: order.shippingFee,

    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,

      product: {
        id: item.product.id,
        name: item.product.name,
        images: item.product.images.map((img) => ({
          imageUrl: img.imageUrl,
        })),
      },

      variant: item.variant
        ? {
            id: item.variant.id,
            color: item.variant.color,
            size: item.variant.size,
          }
        : null,
    })),
  };

  return <OrderSummaryCard order={orderDTO} />;
}
