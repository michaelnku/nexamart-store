"use server";

import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { autoAssignRider } from "@/lib/rider/logistics";
import { completeDeliveryAndPayRider } from "@/lib/rider/completeDeliveryPayout";
import { DeliveryStatus, OrderStatus } from "@/generated/prisma/client";
import { hashOtp } from "@/lib/otp";
import { moveOrderEarningsToPending } from "@/lib/payout/moveToPendingOnDelivery";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import {
  assertValidTransition,
  normalizeOrderStatus,
} from "@/lib/order/orderLifecycle";
import {
  parseRiderDeliveryStatusKey,
  RIDER_DELIVERY_STATUS_FILTERS,
  RiderDeliveryCounts,
  canAutoAssignForOrderStatus,
  canVerifyDeliveryStatus,
  toRiderClientDeliveryStatus,
} from "@/lib/rider/types";

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
  if (!canAutoAssignForOrderStatus(order.status)) {
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
    select: {
      id: true,
      riderId: true,
      status: true,
      orderId: true,
      order: { select: { status: true } },
    },
  });

  if (!delivery) return { error: "Delivery not found" };
  if (delivery.riderId !== userId) return { error: "Not assigned to rider" };
  if (delivery.status !== "ASSIGNED") {
    return { error: `Delivery status ${delivery.status} cannot be accepted` };
  }

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: "PICKED_UP" },
    }),
    prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: (() => {
          const nextStatus: OrderStatus = "IN_DELIVERY";
          assertValidTransition(
            normalizeOrderStatus(delivery.order.status),
            nextStatus,
          );
          return nextStatus;
        })(),
      },
    }),
  ]);

  await createOrderTimelineIfMissing({
    orderId: delivery.orderId,
    status: "IN_DELIVERY",
    message: "Rider is currently delivering your order.",
  });

  return { success: true };
}

export async function riderCancelAssignedDeliveryAction(deliveryId: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "RIDER") return { error: "Forbidden" };

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      riderId: true,
      status: true,
      orderId: true,
    },
  });

  if (!delivery) return { error: "Delivery not found" };
  if (delivery.riderId !== userId) return { error: "Not assigned to rider" };
  if (delivery.status !== "ASSIGNED") {
    return { error: `Delivery status ${delivery.status} cannot be cancelled` };
  }

  await prisma.$transaction(async (tx) => {
    const releasedDelivery = await tx.delivery.updateMany({
      where: {
        id: deliveryId,
        riderId: userId,
        status: "ASSIGNED",
      },
      data: {
        riderId: null,
        status: "PENDING_ASSIGNMENT",
        assignedAt: null,
        otpAttempts: 0,
        otpExpiresAt: null,
        otpHash: null,
        isLocked: false,
        lockedAt: null,
      },
    });

    if (releasedDelivery.count !== 1) {
      throw new Error("Failed to release assigned delivery.");
    }

    await tx.riderProfile.updateMany({
      where: { userId, isAvailable: false },
      data: { isAvailable: true },
    });

    await createOrderTimelineIfMissing(
      {
        orderId: delivery.orderId,
        status: "READY",
        message: "Rider cancelled assigned delivery. Reassignment pending.",
      },
      tx,
    );
  });

  return { success: true };
}

export async function verifyDeliveryOTPAction(deliveryId: string, otp: string) {
  const MAX_OTP_ATTEMPTS = 5;
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
  if (!canVerifyDeliveryStatus(delivery.status)) {
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

    if (nextAttempts > MAX_OTP_ATTEMPTS) {
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

    const attemptsLeft = Math.max(0, MAX_OTP_ATTEMPTS - nextAttempts + 1);

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

  await prisma.$transaction(async (tx) => {
    await tx.delivery.update({
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
    });

    await tx.order.update({
      where: { id: delivery.orderId },
      data: {
        status: (() => {
          const nextStatus: OrderStatus = "DELIVERED";
          assertValidTransition(
            normalizeOrderStatus(delivery.order.status),
            nextStatus,
          );
          return nextStatus;
        })(),
        customerConfirmedAt: confirmedAt,
      },
    });

    await createOrderTimelineIfMissing(
      {
        orderId: delivery.orderId,
        status: "DELIVERED",
        message: "Order delivered successfully.",
      },
      tx,
    );
  });

  await moveOrderEarningsToPending(delivery.orderId);

  return { success: true };
}

export async function riderVerifyDeliveryOtpAction(
  deliveryId: string,
  otp: string,
) {
  return verifyDeliveryOTPAction(deliveryId, otp);
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

export async function getRiderDeliveriesAction(statusKey?: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "RIDER") return { error: "Forbidden" };

  const activeKey = parseRiderDeliveryStatusKey(statusKey);

  const countsRaw = await prisma.delivery.groupBy({
    by: ["status"],
    where: { riderId: userId },
    _count: { _all: true },
  });

  const [pendingUnassignedDeliveriesCount, pendingReadyOrdersCount] =
    await Promise.all([
      prisma.delivery.count({
        where: {
          status: { in: ["PENDING_ASSIGNMENT"] as DeliveryStatus[] },
          riderId: null,
        },
      }),
      prisma.order.count({
        where: {
          isPaid: true,
          status: { in: ["READY", "ACCEPTED"] },
          delivery: null,
          sellerGroups: {
            some: {},
            every: {
              OR: [
                { status: "VERIFIED_AT_HUB" },
                { status: "ARRIVED_AT_HUB" },
                { status: "READY" },
                { status: "CANCELLED" },
              ],
            },
          },
        },
      }),
    ]);

  const counts: RiderDeliveryCounts = {
    pending:
      (countsRaw.find((c) => c.status === "PENDING_ASSIGNMENT")?._count._all ??
        0) +
      pendingUnassignedDeliveriesCount +
      pendingReadyOrdersCount,
    assigned: countsRaw.find((c) => c.status === "ASSIGNED")?._count._all ?? 0,
    ongoing: countsRaw.find((c) => c.status === "PICKED_UP")?._count._all ?? 0,
    delivered:
      countsRaw.find((c) => c.status === "DELIVERED")?._count._all ?? 0,
    cancelled:
      countsRaw.find((c) => c.status === "CANCELLED")?._count._all ?? 0,
  };

  const deliveries = await prisma.delivery.findMany({
    where:
      activeKey === "pending"
        ? {
            status: {
              in: RIDER_DELIVERY_STATUS_FILTERS[activeKey],
            },
            OR: [{ riderId: userId }, { riderId: null }],
          }
        : {
            riderId: userId,
            status: {
              in: RIDER_DELIVERY_STATUS_FILTERS[activeKey],
            },
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
      clientStatus: toRiderClientDeliveryStatus(delivery.status),
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
            status: { in: ["READY", "ACCEPTED"] },
            delivery: null,
            sellerGroups: {
              some: {},
              every: {
                OR: [
                  { status: "VERIFIED_AT_HUB" },
                  { status: "ARRIVED_AT_HUB" },
                  { status: "READY" },
                  { status: "CANCELLED" },
                ],
              },
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
      status: "PENDING_ASSIGNMENT" as DeliveryStatus,
      clientStatus: toRiderClientDeliveryStatus("PENDING_ASSIGNMENT"),
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
