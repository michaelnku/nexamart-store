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

export async function getAdminStats() {
  const user = await CurrentUser();

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const [totalUsers, totalProducts, totalRevenue, pendingPayouts] =
    await Promise.all([
      //  Total users
      prisma.user.count(),

      //  Total products
      prisma.product.count({
        where: { isPublished: true },
      }),

      //  Total completed platform revenue
      prisma.order.aggregate({
        where: {
          isPaid: true,
          status: "DELIVERED",
        },
        _sum: {
          totalAmount: true,
        },
      }),

      //  Pending seller payouts
      prisma.orderSellerGroup.count({
        where: {
          payoutStatus: "PENDING",
        },
      }),
    ]);

  return {
    totalUsers,
    totalProducts,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    pendingReports: pendingPayouts,
  };
}

export async function getRiderStats() {
  const user = await CurrentUser();

  if (!user || user.role !== "RIDER") {
    throw new Error("Unauthorized");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    activeDeliveries,
    completedToday,
    wallet,
    nextDelivery,
    recentDeliveries,
    riderTransactions,
  ] = await Promise.all([
    prisma.delivery.count({
      where: {
        riderId: user.id,
        status: { in: ["ASSIGNED", "IN_TRANSIT"] },
      },
    }),
    prisma.delivery.count({
      where: {
        riderId: user.id,
        status: "DELIVERED",
        deliveredAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    }),
    prisma.wallet.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        totalEarnings: true,
      },
    }),
    prisma.delivery.findFirst({
      where: {
        riderId: user.id,
        status: { in: ["ASSIGNED", "IN_TRANSIT"] },
      },
      orderBy: {
        assignedAt: "asc",
      },
      select: {
        assignedAt: true,
      },
    }),
    prisma.delivery.findMany({
      where: {
        riderId: user.id,
      },
      orderBy: {
        assignedAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        status: true,
        fee: true,
        assignedAt: true,
        deliveredAt: true,
        order: {
          select: {
            trackingNumber: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: { in: ["EARNING", "WITHDRAWAL"] },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
      },
    }),
  ]);

  const latestEvents = [
    ...recentDeliveries.map((delivery) => ({
      id: `delivery-${delivery.id}`,
      type: "DELIVERY" as const,
      title: delivery.order.trackingNumber
        ? `Order #${delivery.order.trackingNumber}`
        : "Delivery Event",
      description: `Delivery status changed to ${delivery.status.replace(/_/g, " ").toLowerCase()}`,
      status: delivery.status,
      amount: delivery.fee,
      createdAt:
        delivery.deliveredAt ?? delivery.assignedAt ?? delivery.order.createdAt,
    })),
    ...riderTransactions.map((transaction) => ({
      id: `tx-${transaction.id}`,
      type: transaction.type,
      title:
        transaction.type === "EARNING" ? "Earnings Update" : "Withdrawal Event",
      description: transaction.description ?? "Wallet transaction update",
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    }));

  return {
    activeDeliveries,
    completedToday,
    totalEarnings: wallet?.totalEarnings ?? 0,
    nextDeliveryAt: nextDelivery?.assignedAt?.toISOString() ?? null,
    latestEvents,
  };
}
