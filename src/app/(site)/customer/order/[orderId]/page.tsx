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

  const deliveryAddress = [
    order.deliveryStreet,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryCountry,
    order.deliveryPostal,
  ]
    .filter((part) => Boolean(part && part.trim()))
    .join(", ");

  const orderDTO: OrderDetailDTO = {
    id: order.id,
    status: order.status,
    trackingNumber: order.trackingNumber,
    deliveryType: order.deliveryType,
    deliveryAddress,
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

  const trackingNumber = order.trackingNumber ?? "NEX-ORD-XXXXX";

  return (
    <div className="">
      <div className="mx-auto max-w-6xl rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        A one-time delivery code will be sent to your phone number. Please call
        it out to the rider at the delivery point for order:{" "}
        <span className="font-semibold">{trackingNumber}</span>.
      </div>
      <OrderCard order={orderDTO} />
    </div>
  );
}
