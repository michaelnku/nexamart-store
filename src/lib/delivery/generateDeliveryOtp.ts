"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateDeliveryOtpAndCreateDelivery(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      deliveryAddress: true,
      shippingFee: true,
      distanceInMiles: true,
      user: { select: { phone: true } },
    },
  });

  if (!order) throw new Error("Order not found");

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const delivery = await prisma.delivery.create({
    data: {
      orderId,
      status: "PENDING",
      fee: order.shippingFee,
      deliveryAddress: order.deliveryAddress,
      distance: order.distanceInMiles,
      otpHash,
      otpExpiresAt: expiresAt,
    },
  });

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-otp`, {
    method: "POST",
    body: JSON.stringify({ phone: order.phone }),
  });

  if (!res.ok) {
    console.error("Failed to send OTP");
  }

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
