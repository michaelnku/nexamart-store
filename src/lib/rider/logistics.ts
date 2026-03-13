import { prisma } from "../prisma";
import { pusherServer } from "../pusher";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { generateDeliveryOTP } from "@/lib/delivery/generateDeliveryOtp";
import { sendDeliveryOtpToCustomer } from "@/lib/delivery/sendDeliveryOtpToCustomer";
import { DeliveryStatus } from "@/generated/prisma/edge";
import { createNotification } from "../notifications/createNotification";

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
  let generatedOtp: string | null = null;
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

    generatedOtp = await generateDeliveryOTP(tx, assignedDeliveryId);

    console.info("[autoAssignRider] delivery assignment transaction complete", {
      orderId,
      deliveryId: assignedDeliveryId,
      riderId,
      otpGenerated: Boolean(generatedOtp),
    });

    await createOrderTimelineIfMissing(
      {
        orderId,
        status: "READY",
        message: "Rider assigned. Delivery OTP has been generated.",
      },
      tx,
    );
  });

  if (!assignedDeliveryId) {
    return { assigned: false };
  }

  await createNotification({
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

  await createNotification({
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

  await Promise.all([
    pusherServer.trigger(`notifications-${riderId}`, "new-notification", {
      event: "RIDER_ASSIGNED",
      orderId,
    }),

    pusherServer.trigger(`notifications-${order.userId}`, "new-notification", {
      event: "RIDER_ASSIGNED",
      orderId,
    }),
  ]);

  await pusherServer.trigger(`user-${order.userId}`, "rider-assigned", {
    orderId,
    riderId,
  });

  if (generatedOtp) {
    console.info("[autoAssignRider] sending delivery otp to customer", {
      orderId,
      riderId,
      hasDeliveryPhone: Boolean(order.deliveryPhone),
    });
    const otpSendResult = await sendDeliveryOtpToCustomer(
      order.userId,
      order.deliveryPhone,
      generatedOtp,
    );

    if (!otpSendResult.success) {
      console.warn("[autoAssignRider] delivery otp send unavailable", {
        orderId,
        riderId,
        deliveryId: assignedDeliveryId,
        code: otpSendResult.code,
        message: otpSendResult.message,
      });

      await createOrderTimelineIfMissing({
        orderId,
        status: "READY",
        message:
          "OTP service temporarily unavailable. Rider assigned successfully, but customer OTP delivery needs attention.",
      });

      return {
        assigned: true,
        warningMessage:
          "OTP service temporarily unavailable. Rider assigned successfully, but the customer did not receive the delivery OTP automatically.",
      };
    }

    console.info("[autoAssignRider] delivery otp send completed", {
      orderId,
      riderId,
      channel: otpSendResult.channel,
    });

    await createOrderTimelineIfMissing({
      orderId,
      status: "READY",
      message: "Delivery OTP has been sent to customer.",
    });
  } else {
    console.warn(
      "[autoAssignRider] otp send skipped: reusable otp already exists",
      {
        orderId,
        riderId,
        deliveryId: assignedDeliveryId,
      },
    );
  }

  return { assigned: true };
}
