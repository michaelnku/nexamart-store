import { prisma } from "@/lib/prisma";
import OrderCard from "@/components/order/OrderCard";
import { OrderDetailDTO } from "@/lib/types";
import { CurrentUserId } from "@/lib/currentUser";

export default async function OrderDetailsPage({
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
      customer: true,
      sellerGroups: {
        include: {
          store: true,
          seller: true,
          items: {
            include: {
              product: { include: { images: true } },
              variant: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return (
      <p className="text-center text-red-500 py-40 min-h-screen">
        Order not found
      </p>
    );
  }

  if (order.userId !== userId) {
    return <p>Unauthorized</p>;
  }

  const orderDTO: OrderDetailDTO = {
    id: order.id,
    status: order.status,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),

    customer: {
      name: order.customer.name,
      email: order.customer.email,
    },

    sellerGroups: order.sellerGroups.map((group) => ({
      id: group.id,
      status: group.status,
      subtotal: group.subtotal,

      store: {
        name: group.store.name,
        slug: group.store.slug,
      },

      items: group.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,

        product: {
          name: item.product.name,
          images: item.product.images.map((img) => ({
            imageUrl: img.imageUrl,
          })),
        },

        variant: item.variant
          ? {
              color: item.variant.color,
              size: item.variant.size,
            }
          : null,
      })),
    })),
  };

  return <OrderCard order={orderDTO} />;
}
