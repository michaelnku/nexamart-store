import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import OrderTrackGrid from "@/components/order/OrderTrackGrid";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default async function TrackAllActiveOrdersPage() {
  const userId = await CurrentUserId();

  if (!userId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-600">
          Please{" "}
          <Link href="/login" className="text-[var(--brand-blue)] underline">
            login
          </Link>{" "}
          to track your orders.
        </p>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    where: {
      userId,
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

  if (orders.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600">No active orders.</p>

        <div className="w-full max-w-sm">
          <Input placeholder="Enter tracking number" />
          <p className="text-xs text-gray-500 mt-2">
            Got a tracking number? Track your order above.
          </p>
        </div>
      </main>
    );
  }

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

  return <OrderTrackGrid orders={orderDTOs} />;
}
