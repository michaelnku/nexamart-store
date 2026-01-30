import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import OrderHistoryCard from "@/components/order/OrderHistoryCard";
import { OrderHistoryDTO } from "@/lib/types";

export default async function OrdersPage() {
  const userId = await CurrentUserId();
  if (!userId)
    return (
      <p className="text-center py-40 text-gray-500 text-lg">
        Login required to view orders
      </p>
    );

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
    },
  });

  if (orders.length === 0)
    return (
      <div className="text-center py-40">
        <p className="text-gray-500 text-lg mb-4">You have no orders yet</p>
        <Link href="/">
          <Button
            className="
                bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white font-medium"
          >
            Start Shopping
          </Button>
        </Link>
      </div>
    );

  const ordersDTO: OrderHistoryDTO = orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    totalAmount: order.totalAmount,
    trackingNumber: order.trackingNumber,

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
  }));

  return <OrderHistoryCard orders={ordersDTO} />;
}
