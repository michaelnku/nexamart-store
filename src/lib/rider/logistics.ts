import { prisma } from "../prisma";
import { pusherServer } from "../pusher";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { generateDeliveryOTP } from "@/lib/delivery/generateDeliveryOtp";

export async function autoAssignRider(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      isFoodOrder: true,
      shippingFee: true,
      deliveryStreet: true,
      deliveryCity: true,
      deliveryState: true,
      deliveryCountry: true,
      deliveryPostal: true,
      distanceInMiles: true,
      delivery: {
        select: { id: true, riderId: true, status: true },
      },
      sellerGroups: { select: { status: true } },
    },
  });

  if (!order) return;

  if (order.delivery?.riderId) return;

  if (!order.sellerGroups.length) return;

  if (!order.isFoodOrder) {
    const activeGroups = order.sellerGroups.filter(
      (group) => group.status !== "CANCELLED",
    );
    if (!activeGroups.length) return;
    if (activeGroups.some((group) => group.status !== "ARRIVED_AT_HUB")) {
      return;
    }
  }

  const riderProfile = await prisma.riderProfile.findFirst({
    where: {
      isAvailable: true,
      isVerified: true,
      user: { role: "RIDER" },
    },
    orderBy: { updatedAt: "asc" },
    select: { userId: true },
  });

  if (!riderProfile) return;

  const riderId = riderProfile.userId;
  const assignedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const riderReserved = await tx.riderProfile.updateMany({
      where: { userId: riderId, isAvailable: true },
      data: { isAvailable: false },
    });

    if (riderReserved.count !== 1) {
      return;
    }

    const orderLocked = await tx.order.updateMany({
      where: {
        id: orderId,
        status: { not: "OUT_FOR_DELIVERY" },
      },
      data: { status: "OUT_FOR_DELIVERY" },
    });

    if (orderLocked.count !== 1) {
      return;
    }

    let assignedDeliveryId: string | null = null;

    if (order.delivery?.id) {
      const deliveryAssigned = await tx.delivery.updateMany({
        where: {
          id: order.delivery.id,
          riderId: null,
        },
        data: {
          riderId,
          status: "ASSIGNED",
          assignedAt,
        },
      });

      if (deliveryAssigned.count !== 1) {
        return;
      }
      assignedDeliveryId = order.delivery.id;
    } else {
      const deliveryAddress = [
        order.deliveryStreet,
        order.deliveryCity,
        order.deliveryState,
        order.deliveryCountry,
        order.deliveryPostal,
      ]
        .filter((part) => Boolean(part && part.trim()))
        .join(", ");

      const createdDelivery = await tx.delivery.create({
        data: {
          orderId,
          riderId,
          status: "ASSIGNED",
          assignedAt,
          fee: order.shippingFee,
          deliveryAddress,
          distance: order.distanceInMiles,
        },
        select: { id: true },
      });

      assignedDeliveryId = createdDelivery.id;
    }

    if (!assignedDeliveryId) {
      return;
    }

    await generateDeliveryOTP(tx, assignedDeliveryId);

    await createOrderTimelineIfMissing(
      {
        orderId,
        status: "OUT_FOR_DELIVERY",
        message: "Rider has picked up your order. Delivery OTP has been generated.",
      },
      tx,
    );
  });

  await pusherServer.trigger(`user-${order.userId}`, "rider-assigned", {
    orderId,
    riderId,
  });
}
