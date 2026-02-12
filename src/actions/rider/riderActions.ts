"use server";

import { prisma } from "@/lib/prisma";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { autoAssignRider } from "@/lib/rider/logistics";
import { verifyDeliveryOtp } from "@/services/verifyDeliveryOtp";
import { completeDeliveryAndPayRider } from "@/lib/rider/completeDeliveryPayout";
import { DeliveryStatus } from "@/generated/prisma/client";

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

  if (!delivery.otpHash || !delivery.otpExpiresAt)
    return { error: "OTP not generated" };

  if (delivery.otpExpiresAt < new Date()) return { error: "OTP expired" };

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/verify-otp`, {
    method: "POST",
    body: JSON.stringify({
      phone: delivery.order.phone,
      code: otp,
    }),
  });

  const result = await res.json();

  if (!result.success) {
    return { error: "Invalid OTP" };
  }

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: "DELIVERED",
        customerConfirmedAt: new Date(),
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

  await prisma.job.create({
    data: {
      type: "RELEASE_PAYOUT",
      payload: { orderId: delivery.orderId },
    },
  });

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
  } catch (error: any) {
    return { error: error?.message ?? "Failed to complete delivery payout" };
  }
}

type RiderDeliveryStatusKey = "pending" | "assigned" | "ongoing" | "cancelled";

const STATUS_KEY_MAP: Record<RiderDeliveryStatusKey, DeliveryStatus[]> = {
  pending: ["PENDING"],
  assigned: ["ASSIGNED"],
  ongoing: ["IN_TRANSIT"],
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

  const counts = {
    pending: countsRaw.find((c) => c.status === "PENDING")?._count._all ?? 0,
    assigned: countsRaw.find((c) => c.status === "ASSIGNED")?._count._all ?? 0,
    ongoing: countsRaw.find((c) => c.status === "IN_TRANSIT")?._count._all ?? 0,
    cancelled:
      countsRaw.find((c) => c.status === "CANCELLED")?._count._all ?? 0,
  };

  const deliveries = await prisma.delivery.findMany({
    where: {
      riderId: userId,
      status: { in: STATUS_KEY_MAP[activeKey] },
    },
    orderBy: { assignedAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          trackingNumber: true,
          deliveryAddress: true,
          totalAmount: true,
          shippingFee: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
        },
      },
    },
  });

  return { deliveries, counts, activeKey };
}
