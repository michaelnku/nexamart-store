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

  if (order.sellerGroups.some((g) => g.status !== "ARRIVED_AT_HUB")) {
    return;
  }

  const rider = await prisma.user.findFirst({
    where: {
      role: "RIDER",
      riderProfile: { isAvailable: true, isVerified: true },
    },
    include: { riderProfile: true },
  });

  if (!rider) return;

  await prisma.$transaction(async (tx) => {
    if (order.delivery?.id) {
      await tx.delivery.update({
        where: { id: order.delivery.id },
        data: {
          riderId: rider.id,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      });
    } else {
      await tx.delivery.create({
        data: {
          orderId,
          riderId: rider.id,
          fee: order.shippingFee,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      });
    }

    await tx.riderProfile.update({
      where: { userId: rider.id },
      data: { isAvailable: false },
    });

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
    riderId: rider.id,
  });
}

