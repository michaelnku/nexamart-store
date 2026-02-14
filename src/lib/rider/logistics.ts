import { prisma } from "../prisma";
import { pusherServer } from "../pusher";

export async function autoAssignRider(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      shippingFee: true,
      delivery: true,
      sellerGroups: { select: { status: true } },
    },
  });

  if (!order || order.delivery) return;
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

  await prisma.$transaction([
    prisma.delivery.create({
      data: {
        orderId,
        riderId: rider.id,
        fee: order.shippingFee,
        status: "PENDING",
        assignedAt: new Date(),
      },
    }),
    prisma.riderProfile.update({
      where: { userId: rider.id },
      data: { isAvailable: false },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED" },
    }),
    prisma.orderTimeline.create({
      data: {
        orderId,
        status: "SHIPPED",
        message: "Rider assigned automatically",
      },
    }),
  ]);

  await pusherServer.trigger(`user-${order.userId}`, "rider-assigned", {
    orderId,
    riderId: rider.id,
  });
}

