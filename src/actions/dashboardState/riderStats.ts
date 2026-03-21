"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";

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
    releasedRiderPayouts,
    riderProfile,
    assignedPendingAcceptCount,
    pendingPayouts,
    nextDelivery,
    recentDeliveries,
    riderTransactions,
  ] = await Promise.all([
    prisma.delivery.count({
      where: {
        riderId: user.id,
        status: { in: ["ASSIGNED", "PICKED_UP"] },
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
    prisma.ledgerEntry.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        userId: user.id,
        entryType: "RIDER_PAYOUT",
        direction: "CREDIT",
      },
    }),
    prisma.riderProfile.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        isVerified: true,
        isAvailable: true,
      },
    }),
    prisma.delivery.count({
      where: {
        riderId: user.id,
        status: "ASSIGNED",
      },
    }),
    prisma.withdrawal.count({
      where: {
        wallet: { userId: user.id },
        status: { in: ["PENDING", "PROCESSING", "APPROVED"] },
      },
    }),
    prisma.delivery.findFirst({
      where: {
        riderId: user.id,
        status: { in: ["ASSIGNED", "PICKED_UP"] },
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
      type: transaction.type as "EARNING" | "WITHDRAWAL",
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
    totalEarnings: releasedRiderPayouts._sum.amount ?? 0,
    isRiderVerified: riderProfile?.isVerified ?? false,
    isRiderAvailable: riderProfile?.isAvailable ?? false,
    assignedPendingAcceptCount,
    pendingPayouts,
    nextDeliveryAt: nextDelivery?.assignedAt?.toISOString() ?? null,
    latestEvents,
  };
}
