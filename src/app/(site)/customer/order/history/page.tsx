import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import OrderHistoryCard from "@/components/order/OrderHistoryCard";
import { OrderHistoryDTO } from "@/lib/types";

export default async function OrdersPage() {
  const userId = await CurrentUserId();
  if (!userId) {
    return (
      <p className="py-40 text-center text-lg text-gray-500 dark:text-zinc-400">
        Login required to view orders
      </p>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      dispute: true,
      sellerGroups: {
        select: {
          prepTimeMinutes: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              images: {
                include: productImageWithAssetInclude,
              },
            },
          },
          variant: true,
        },
      },
    },
  });

  if (orders.length === 0) {
    return (
      <div className="py-40 text-center">
        <p className="mb-4 text-lg text-gray-500 dark:text-zinc-400">
          You have no orders yet
        </p>
        <Link href="/">
          <Button className="bg-[var(--brand-blue)] font-medium text-white hover:bg-[var(--brand-blue-hover)]">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  const ordersDTO: OrderHistoryDTO = orders.map((order) => ({
    prepTimeMinutes:
      order.sellerGroups
        .map((group) => group.prepTimeMinutes)
        .filter((value): value is number => typeof value === "number")
        .reduce((max, value) => Math.max(max, value), 0) || null,
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    isFoodOrder: order.isFoodOrder,
    totalAmount: order.totalAmount,
    trackingNumber: order.trackingNumber,
    dispute: order.dispute
      ? {
          id: order.dispute.id,
          orderId: order.id,
          status: order.dispute.status,
          reason: order.dispute.reason,
          description: order.dispute.description,
          resolution: order.dispute.resolution,
          refundAmount: order.dispute.refundAmount,
          createdAt: order.dispute.createdAt.toISOString(),
          updatedAt: order.dispute.updatedAt.toISOString(),
          evidence: [],
          messages: [],
          sellerImpacts: [],
          returnRequest: null,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        name: item.product.name,
        images: item.product.images.map((img) => ({
          imageUrl: img.fileAsset.url,
        })),
      },
    })),
  }));

  return <OrderHistoryCard orders={ordersDTO} />;
}
import { productImageWithAssetInclude } from "@/lib/product-images";
