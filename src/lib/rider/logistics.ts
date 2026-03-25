import { prisma } from "../prisma";
import { pusherServer } from "../pusher";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { DeliveryStatus } from "@/generated/prisma/edge";
import { createRealtimeNotification } from "../notifications/createNotification";

export type AutoAssignRiderResult = {
  assigned: boolean;
  warningMessage?: string;
};

export async function autoAssignRider(
  orderId: string,
): Promise<AutoAssignRiderResult> {
  console.info("[autoAssignRider] start", { orderId });

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
      deliveryPhone: true,
      distanceInMiles: true,
      delivery: {
        select: { id: true, riderId: true, status: true },
      },
      sellerGroups: { select: { status: true } },
    },
  });

  if (!order) {
    console.info("[autoAssignRider] skipped: order not found", { orderId });
    return { assigned: false };
  }

  if (order.delivery?.riderId) {
    console.info("[autoAssignRider] skipped: delivery already assigned", {
      orderId,
      deliveryId: order.delivery.id,
      riderId: order.delivery.riderId,
      deliveryStatus: order.delivery.status,
    });
    return { assigned: false };
  }

  if (!order.sellerGroups.length) {
    console.info("[autoAssignRider] skipped: no seller groups", { orderId });
    return { assigned: false };
  }

  if (order.isFoodOrder) {
    const activeGroups = order.sellerGroups.filter(
      (group) => group.status !== "CANCELLED",
    );
    if (!activeGroups.length) {
      console.info("[autoAssignRider] skipped: no active food seller groups", {
        orderId,
      });
      return { assigned: false };
    }
    if (activeGroups.some((group) => group.status !== "READY")) {
      console.info("[autoAssignRider] skipped: food order not fully ready", {
        orderId,
        sellerGroupStatuses: activeGroups.map((group) => group.status),
      });
      return { assigned: false };
    }
  } else {
    const activeGroups = order.sellerGroups.filter(
      (group) => group.status !== "CANCELLED",
    );
    if (!activeGroups.length) {
      console.info(
        "[autoAssignRider] skipped: no active non-food seller groups",
        { orderId },
      );
      return { assigned: false };
    }
    if (
      activeGroups.some(
        (group) =>
          group.status !== "VERIFIED_AT_HUB" &&
          group.status !== "ARRIVED_AT_HUB",
      )
    ) {
      console.info(
        "[autoAssignRider] skipped: non-food order not ready for dispatch",
        {
          orderId,
          sellerGroupStatuses: activeGroups.map((group) => group.status),
        },
      );
      return { assigned: false };
    }
  }

  console.info("[autoAssignRider] looking for available rider", { orderId });

  const riderProfile = await prisma.riderProfile.findFirst({
    where: {
      isAvailable: true,
      isVerified: true,
      user: { role: "RIDER" },
    },
    orderBy: { updatedAt: "asc" },
    select: { userId: true },
  });

  if (!riderProfile) {
    console.warn("[autoAssignRider] skipped: no available rider found", {
      orderId,
    });
    return { assigned: false };
  }

  console.info("[autoAssignRider] rider selected", {
    orderId,
    riderId: riderProfile.userId,
  });

  const riderId = riderProfile.userId;
  const assignedAt = new Date();
  let assignedDeliveryId: string | null = null;

  await prisma.$transaction(async (tx) => {
    if (order.delivery?.id) {
      const deliveryAssigned = await tx.delivery.updateMany({
        where: {
          id: order.delivery.id,
          status: { in: ["PENDING_ASSIGNMENT"] as DeliveryStatus[] },
          riderId: null,
        },
        data: {
          riderId,
          status: "ASSIGNED",
          assignedAt,
        },
      });

      if (deliveryAssigned.count !== 1) {
        console.warn("[autoAssignRider] existing delivery assignment failed", {
          orderId,
          deliveryId: order.delivery.id,
          riderId,
        });
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
      console.info("[autoAssignRider] delivery created and assigned", {
        orderId,
        deliveryId: createdDelivery.id,
        riderId,
      });
    }

    if (!assignedDeliveryId) {
      console.warn("[autoAssignRider] aborted: no delivery id after assignment", {
        orderId,
        riderId,
      });
      return;
    }

    const riderReserved = await tx.riderProfile.updateMany({
      where: { userId: riderId, isAvailable: true },
      data: { isAvailable: false },
    });

    if (riderReserved.count !== 1) {
      throw new Error("Failed to reserve rider");
    }

    console.info("[autoAssignRider] delivery assignment transaction complete", {
      orderId,
      deliveryId: assignedDeliveryId,
      riderId,
      otpGenerated: false,
    });

    await createOrderTimelineIfMissing(
      {
        orderId,
        status: "READY",
        message: "Rider assigned.",
      },
      tx,
    );
  });

  if (!assignedDeliveryId) {
    return { assigned: false };
  }

  await createRealtimeNotification({
    userId: riderId,
    event: "RIDER_ASSIGNED",
    title: "New Delivery Assigned",
    message: "A delivery has been assigned to you",
    link: `/marketplace/dashboard/rider/deliveries/${orderId}`,
    key: `rider-assigned-${orderId}-${riderId}`,
    metadata: {
      orderId,
      type: "delivery",
    },
  });

  await createRealtimeNotification({
    userId: order.userId,
    event: "RIDER_ASSIGNED",
    title: "Rider Assigned",
    message: "Your order is now out for delivery",
    link: `/customer/order/${orderId}`,
    key: `customer-rider-assigned-${orderId}`,
    metadata: {
      orderId,
      type: "delivery",
    },
  });
  await pusherServer.trigger(`user-${order.userId}`, "rider-assigned", {
    orderId,
    riderId,
  });

  console.warn("[autoAssignRider] delivery otp trigger temporarily disabled", {
    orderId,
    riderId,
    deliveryId: assignedDeliveryId,
    hasDeliveryPhone: Boolean(order.deliveryPhone),
  });

  return { assigned: true };
}
