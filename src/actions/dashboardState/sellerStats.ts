"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";

export async function getSellerStats() {
  const user = await CurrentUser();

  if (!user || user.role !== "SELLER") {
    throw new Error("Unauthorized");
  }

  const store = await prisma.store.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      isVerified: true,
      isSuspended: true,
    },
  });

  if (!store) {
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      lowStockCount: 0,
      pendingPayouts: 0,
      isStoreVerified: false,
      latestEvents: [],
    };
  }

  const [
    totalProducts,
    totalOrders,
    totalRevenue,
    lowStockCount,
    pendingPayouts,
    recentOrderEvents,
    reviewEvents,
    payoutEvents,
  ] = await Promise.all([
    //total product
    prisma.product.count({
      where: {
        storeId: store.id,
        isPublished: true,
      },
    }),

    //total seller orders
    prisma.orderSellerGroup.count({
      where: {
        sellerId: user.id,
      },
    }),

    //completed revenue
    prisma.orderSellerGroup.aggregate({
      where: {
        sellerId: user.id,
        payoutStatus: "COMPLETED",
      },
      _sum: {
        subtotal: true,
      },
    }),

    //  Low-stock variants
    prisma.productVariant.count({
      where: {
        product: { storeId: store.id },
        stock: { lt: 5 },
      },
    }),

    //  Pending payouts
    prisma.orderSellerGroup.count({
      where: {
        sellerId: user.id,
        payoutStatus: "PENDING",
        status: { not: "CANCELLED" },
        order: {
          status: { not: "CANCELLED" },
        },
      },
    }),
    prisma.orderSellerGroup.findMany({
      where: {
        sellerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        status: true,
        payoutStatus: true,
        subtotal: true,
        createdAt: true,
        order: {
          select: {
            trackingNumber: true,
          },
        },
      },
    }),
    prisma.review.findMany({
      where: {
        product: {
          storeId: store.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        rating: true,
        createdAt: true,
        product: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "SELLER_PAYOUT",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
      },
    }),
  ]);

  const latestEvents = [
    ...recentOrderEvents.map((event) => ({
      id: `order-${event.id}`,
      type: "ORDER" as const,
      title: event.order.trackingNumber
        ? `Order #${event.order.trackingNumber}`
        : "Order Event",
      description: `Order status: ${event.status.replace(/_/g, " ").toLowerCase()}`,
      status: event.payoutStatus,
      amount: event.subtotal,
      createdAt: event.createdAt,
    })),
    ...reviewEvents.map((review) => ({
      id: `review-${review.id}`,
      type: "REVIEW" as const,
      title: "Pending Product Review",
      description: `${review.user.name ?? review.user.username ?? "A customer"} reviewed ${review.product.name}`,
      status: "PENDING",
      amount: null,
      createdAt: review.createdAt,
    })),
    ...payoutEvents.map((payout) => ({
      id: `payout-${payout.id}`,
      type: "PAYOUT" as const,
      title: "Payout Event",
      description: payout.description ?? "Seller payout update",
      status: payout.status,
      amount: payout.amount,
      createdAt: payout.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    }));

  return {
    totalProducts,
    totalOrders,
    totalRevenue: totalRevenue._sum.subtotal ?? 0,
    lowStockCount,
    pendingPayouts,
    isStoreVerified: store.isVerified,
    isStoreSuspended: store.isSuspended,
    latestEvents,
  };
}
