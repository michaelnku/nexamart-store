import { prisma } from "../prisma";
import { pusherServer } from "../pusher";

export async function autoAssignRider(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      shippingFee: true,
      delivery: {
        select: { id: true, riderId: true },
      },
      sellerGroups: { select: { status: true } },
    },
  });

  if (!order) return;

  if (order.delivery?.riderId) return;

  if (!order.sellerGroups.length) return;

  if (order.sellerGroups.some((g) => g.status !== "ARRIVED_AT_HUB")) {
    return;
  }

  const riderProfile = await prisma.riderProfile.findFirst({
    where: {
      isAvailable: true,
      isVerified: true,
      user: { role: "RIDER" },
    },
    select: { userId: true },
  });

  if (!riderProfile) return;

  const riderId = riderProfile.userId;

  await prisma.$transaction(async (tx) => {
    const riderReserved = await tx.riderProfile.updateMany({
      where: { userId: riderId, isAvailable: true },
      data: { isAvailable: false },
    });

    if (riderReserved.count !== 1) {
      return;
    }

    if (order.delivery?.id) {
      await tx.delivery.update({
        where: { id: order.delivery.id },
        data: {
          riderId,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      });
    } else {
      await tx.delivery.create({
        data: {
          orderId,
          riderId,
          fee: order.shippingFee,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED" },
    });

    await tx.orderTimeline.create({
      data: {
        orderId,
        status: "SHIPPED",
        message: "Rider assigned automatically",
      },
    });
  });

  await pusherServer.trigger(`user-${order.userId}`, "rider-assigned", {
    orderId,
    riderId,
  });
}

