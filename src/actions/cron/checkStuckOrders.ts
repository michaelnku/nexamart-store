import { prisma } from "@/lib/prisma";

const HOURS = (h: number) => h * 60 * 60 * 1000;

export async function checkStuckOrders() {
  const now = new Date();

  const pendingOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: {
        lt: new Date(now.getTime() - HOURS(24)),
      },
    },
  });

  for (const order of pendingOrders) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PROCESSING" },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: "PROCESSING",
          message: "Order auto-moved to processing due to inactivity",
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          title: "Order Update",
          message: "Your order is now being processed.",
        },
      });
    });
  }

  const stuckSellerGroups = await prisma.orderSellerGroup.findMany({
    where: {
      status: "PENDING_PICKUP",
      createdAt: {
        lt: new Date(now.getTime() - HOURS(24)),
      },
    },
    include: {
      order: true,
    },
  });

  for (const group of stuckSellerGroups) {
    await prisma.$transaction(async (tx) => {
      await tx.orderSellerGroup.update({
        where: { id: group.id },
        data: { status: "CANCELLED" },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: group.orderId,
          status: "CANCELLED",
          message: "Seller group cancelled due to no pickup",
        },
      });

      await tx.notification.create({
        data: {
          userId: group.sellerId,
          title: "Order Cancelled",
          message: "Your order group was cancelled due to delayed pickup.",
        },
      });
    });
  }

  const stuckDeliveries = await prisma.delivery.findMany({
    where: {
      status: "IN_TRANSIT",
      assignedAt: {
        lt: new Date(now.getTime() - HOURS(72)),
      },
    },
    include: {
      order: true,
    },
  });

  for (const delivery of stuckDeliveries) {
    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: delivery.id },
        data: { status: "CANCELLED" },
      });

      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: "IN_TRANSIT" },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: delivery.orderId,
          status: "IN_TRANSIT",
          message: "Delivery reassignment required due to rider inactivity",
        },
      });

      await tx.notification.create({
        data: {
          userId: delivery.order.userId,
          title: "Delivery Update",
          message: "We are reassigning a rider to your order.",
        },
      });
    });
  }

  return {
    success: true,
    pendingHandled: pendingOrders.length,
    sellerGroupsHandled: stuckSellerGroups.length,
    deliveriesHandled: stuckDeliveries.length,
  };
}
