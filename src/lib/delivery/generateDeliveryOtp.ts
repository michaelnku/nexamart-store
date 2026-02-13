"use server";

import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpSms } from "@/services/sendOtpSms";

export async function generateDeliveryOtpAndCreateDelivery(orderId: string) {
  const existingDelivery = await prisma.delivery.findUnique({
    where: { orderId },
  });

  if (existingDelivery) {
    return existingDelivery;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      deliveryStreet: true,
      deliveryCity: true,
      deliveryState: true,
      deliveryCountry: true,
      deliveryPostal: true,
      shippingFee: true,
      distanceInMiles: true,
      deliveryPhone: true,
    },
  });

  if (!order) throw new Error("Order not found");

  if (!order.deliveryPhone) {
    throw new Error("Customer phone missing");
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const deliveryAddress = [
    order.deliveryStreet,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryCountry,
    order.deliveryPostal,
  ]
    .filter(Boolean)
    .join(", ");

  const delivery = await prisma.delivery.create({
    data: {
      orderId,
      status: "PENDING",
      fee: order.shippingFee,
      deliveryAddress,
      distance: order.distanceInMiles,
      otpHash,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      isLocked: false,
    },
  });

  await sendOtpSms(order.deliveryPhone, otp);

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "ACCEPTED" },
  });

  await prisma.orderTimeline.create({
    data: {
      orderId,
      status: "ACCEPTED",
      message: "Order paid successfully. OTP sent to customer.",
    },
  });

  return delivery;
}
