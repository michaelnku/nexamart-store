"use server";

import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { autoAssignRider } from "@/lib/rider/logistics";
import { completeDeliveryAndPayRider } from "@/lib/rider/completeDeliveryPayout";
import { DeliveryStatus } from "@/generated/prisma/client";
import { hashOtp } from "@/lib/otp";
import { moveOrderEarningsToPending } from "@/lib/payout/moveToPendingOnDelivery";

export async function autoAssignRiderForPaidOrderAction(orderId: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "ADMIN") return { error: "Forbidden" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      isPaid: true,
      status: true,
      delivery: { select: { id: true } },
    },
  });

  if (!order) return { error: "Order not found" };
  if (!order.isPaid) return { error: "Order is not paid" };
  if (order.delivery) return { error: "Delivery already exists" };
  if (!["ACCEPTED", "SHIPPED"].includes(order.status)) {
    return { error: `Order status ${order.status} cannot be assigned` };
  }

  await autoAssignRider(orderId);

  return { success: true };
}

export async function riderAcceptDeliveryAction(deliveryId: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "RIDER") return { error: "Forbidden" };

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    select: { id: true, riderId: true, status: true, orderId: true },
  });

  if (!delivery) return { error: "Delivery not found" };
  if (delivery.riderId !== userId) return { error: "Not assigned to rider" };
  if (delivery.status !== "ASSIGNED") {
    return { error: `Delivery status ${delivery.status} cannot be accepted` };
  }

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: "IN_TRANSIT" },
    }),
    prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: "SHIPPED" },
    }),
    prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: "SHIPPED",
        message: "Rider accepted the delivery",
      },
    }),
  ]);

  return { success: true };
}

export async function riderVerifyDeliveryOtpAction(
  deliveryId: string,
  otp: string,
) {
  const MAX_OTP_ATTEMPTS = 3;
  const ESCROW_DELAY_MS = 24 * 60 * 60 * 1000;

  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "RIDER") return { error: "Forbidden" };

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      order: true,
    },
  });

  if (!delivery) return { error: "Delivery not found" };
  if (delivery.riderId !== userId) return { error: "Not assigned to rider" };
  if (delivery.status !== "IN_TRANSIT") {
    return { error: `Delivery status ${delivery.status} cannot be verified` };
  }
  if (delivery.isLocked) {
    return {
      error:
        "Delivery is locked after too many invalid OTP attempts. Contact admin support.",
    };
  }

  if (!delivery.otpHash || !delivery.otpExpiresAt)
    return { error: "OTP not generated" };

  if (delivery.otpExpiresAt < new Date()) return { error: "OTP expired" };
  const normalizedOtp = otp.trim();
  const otpMatches = hashOtp(normalizedOtp) === delivery.otpHash;

  if (!otpMatches) {
    const nextAttempts = (delivery.otpAttempts ?? 0) + 1;

    if (nextAttempts >= MAX_OTP_ATTEMPTS) {
      await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          otpAttempts: nextAttempts,
          isLocked: true,
          lockedAt: new Date(),
        },
      });

      return {
        error:
          "Invalid OTP. Attempt limit exceeded and delivery has been locked.",
      };
    }

    const attemptsLeft = MAX_OTP_ATTEMPTS - nextAttempts;

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        otpAttempts: nextAttempts,
      },
    });

    return {
      error: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`,
    };
  }

  const confirmedAt = new Date();
  const payoutEligibleAt = new Date(confirmedAt.getTime() + ESCROW_DELAY_MS);

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "DELIVERED",
        deliveredAt: confirmedAt,
        payoutEligibleAt,
        payoutLocked: false,
        otpAttempts: 0,
        isLocked: false,
        lockedAt: null,
      },
    }),
    prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: "DELIVERED",
        customerConfirmedAt: confirmedAt,
      },
    }),
    prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: "DELIVERED",
        message: "Delivery confirmed via OTP",
      },
    }),
  ]);

  await moveOrderEarningsToPending(delivery.orderId);

  return { success: true };
}

export async function completeDeliveryAndPayRiderAction(orderId: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "ADMIN") return { error: "Forbidden" };

  try {
    const result = await completeDeliveryAndPayRider(orderId);
    return result;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to complete delivery payout";
    return { error: message };
  }
}

type RiderDeliveryStatusKey =
  | "pending"
  | "assigned"
  | "ongoing"
  | "delivered"
  | "cancelled";

const STATUS_KEY_MAP: Record<RiderDeliveryStatusKey, DeliveryStatus[]> = {
  pending: ["PENDING"],
  assigned: ["ASSIGNED"],
  ongoing: ["IN_TRANSIT"],
  delivered: ["DELIVERED"],
  cancelled: ["CANCELLED"],
};

export async function getRiderDeliveriesAction(statusKey?: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "RIDER") return { error: "Forbidden" };

  const key = (statusKey ?? "assigned").toLowerCase();
  const activeKey = (
    Object.keys(STATUS_KEY_MAP).includes(key) ? key : "assigned"
  ) as RiderDeliveryStatusKey;

  const countsRaw = await prisma.delivery.groupBy({
    by: ["status"],
    where: { riderId: userId },
    _count: { _all: true },
  });

  const [pendingUnassignedDeliveriesCount, pendingReadyOrdersCount] =
    await Promise.all([
      prisma.delivery.count({
        where: {
          status: "PENDING",
          riderId: null,
        },
      }),
      prisma.order.count({
        where: {
          isPaid: true,
          status: { in: ["ACCEPTED", "SHIPPED"] },
          delivery: null,
          sellerGroups: {
            some: {},
            every: { status: "ARRIVED_AT_HUB" },
          },
        },
      }),
    ]);

  const counts = {
    pending:
      (countsRaw.find((c) => c.status === "PENDING")?._count._all ?? 0) +
      pendingUnassignedDeliveriesCount +
      pendingReadyOrdersCount,
    assigned: countsRaw.find((c) => c.status === "ASSIGNED")?._count._all ?? 0,
    ongoing: countsRaw.find((c) => c.status === "IN_TRANSIT")?._count._all ?? 0,
    delivered:
      countsRaw.find((c) => c.status === "DELIVERED")?._count._all ?? 0,
    cancelled:
      countsRaw.find((c) => c.status === "CANCELLED")?._count._all ?? 0,
  };

  const deliveries = await prisma.delivery.findMany({
    where:
      activeKey === "pending"
        ? {
            status: { in: STATUS_KEY_MAP[activeKey] },
            OR: [{ riderId: userId }, { riderId: null }],
          }
        : {
            riderId: userId,
            status: { in: STATUS_KEY_MAP[activeKey] },
          },
    orderBy: { assignedAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          trackingNumber: true,
          deliveryStreet: true,
          deliveryCity: true,
          deliveryState: true,
          deliveryCountry: true,
          deliveryPostal: true,
          totalAmount: true,
          shippingFee: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
        },
      },
    },
  });

  const deliveriesWithAddress = deliveries.map((delivery) => {
    const order = delivery.order;
    const deliveryAddress = [
      order.deliveryStreet,
      order.deliveryCity,
      order.deliveryState,
      order.deliveryCountry,
      order.deliveryPostal,
    ]
      .filter((part) => Boolean(part && part.trim()))
      .join(", ");

    return {
      ...delivery,
      order: {
        ...order,
        deliveryAddress,
      },
    };
  });

  const pendingOrdersWithoutDelivery =
    activeKey === "pending"
      ? await prisma.order.findMany({
          where: {
            isPaid: true,
            status: { in: ["ACCEPTED", "SHIPPED"] },
            delivery: null,
            sellerGroups: {
              some: {},
              every: { status: "ARRIVED_AT_HUB" },
            },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            trackingNumber: true,
            deliveryStreet: true,
            deliveryCity: true,
            deliveryState: true,
            deliveryCountry: true,
            deliveryPostal: true,
            totalAmount: true,
            shippingFee: true,
            status: true,
            createdAt: true,
            customer: { select: { name: true, email: true } },
          },
        })
      : [];

  const pendingOrderRows = pendingOrdersWithoutDelivery.map((order) => {
    const deliveryAddress = [
      order.deliveryStreet,
      order.deliveryCity,
      order.deliveryState,
      order.deliveryCountry,
      order.deliveryPostal,
    ]
      .filter((part) => Boolean(part && part.trim()))
      .join(", ");

    return {
      id: `pending-order-${order.id}`,
      orderId: order.id,
      riderId: null,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      isLocked: false,
      lockedAt: null,
      status: "PENDING" as DeliveryStatus,
      deliveryAddress: null,
      distance: null,
      fee: order.shippingFee,
      assignedAt: null,
      deliveredAt: null,
      order: {
        ...order,
        deliveryAddress,
      },
      isPendingAssignment: true,
    };
  });

  const mergedDeliveries =
    activeKey === "pending"
      ? [...deliveriesWithAddress, ...pendingOrderRows].sort((a, b) => {
          const aTime = new Date(a.assignedAt ?? a.order.createdAt).getTime();
          const bTime = new Date(b.assignedAt ?? b.order.createdAt).getTime();
          return bTime - aTime;
        })
      : deliveriesWithAddress;

  return { deliveries: mergedDeliveries, counts, activeKey };
}
