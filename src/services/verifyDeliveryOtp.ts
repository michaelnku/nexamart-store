import { prisma } from "@/lib/prisma";
import { hashOtp } from "@/lib/otp";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";

export async function verifyDeliveryOtp(deliveryId: string, otpInput: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { order: true },
  });

  if (!delivery) throw new Error("Delivery not found");

  if (delivery.isLocked) {
    throw new Error("Delivery locked. Admin verification required.");
  }

  if (delivery.status !== "IN_TRANSIT") {
    throw new Error("Delivery not in transit");
  }

  if (!delivery.otpHash || !delivery.otpExpiresAt) {
    throw new Error("OTP not set");
  }

  if (delivery.otpExpiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  if (hashOtp(otpInput) !== delivery.otpHash) {
    const newAttempts = delivery.otpAttempts + 1;

    if (newAttempts >= 3) {
      await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          otpAttempts: newAttempts,
          isLocked: true,
          lockedAt: new Date(),
        },
      });

      throw new Error("Too many failed attempts. Delivery locked.");
    }

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: { otpAttempts: newAttempts },
    });

    throw new Error(`Invalid OTP. Attempt ${newAttempts}/3`);
  }

  await prisma.$transaction(async (tx) => {
    const deliveredAt = new Date();

    await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "DELIVERED",
        deliveredAt,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      },
    });

    await tx.order.update({
      where: { id: delivery.orderId },
      data: {
        status: "DELIVERED",
        customerConfirmedAt: deliveredAt,
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
}
