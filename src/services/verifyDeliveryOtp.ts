import { prisma } from "@/lib/prisma";
import { hashOtp } from "@/lib/otp";

export async function verifyDeliveryOtp(deliveryId: string, otpInput: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { order: true },
  });

  if (!delivery) throw new Error("Delivery not found");
  if (delivery.status !== "IN_TRANSIT") {
    throw new Error("Delivery not in transit");
  }

  const order = delivery.order;

  if (!order.deliveryOtpHash) throw new Error("OTP not set");
  if (order.deliveryOtpExpiresAt! < new Date()) {
    throw new Error("OTP expired");
  }

  if (hashOtp(otpInput) !== order.deliveryOtpHash) {
    throw new Error("Invalid OTP");
  }

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "DELIVERED",
        customerConfirmedAt: new Date(),
        deliveryOtpHash: null,
        deliveryOtpExpiresAt: null,
      },
    }),
    prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: "DELIVERED",
        message: "Order delivered and OTP verified",
      },
    }),
  ]);
}
