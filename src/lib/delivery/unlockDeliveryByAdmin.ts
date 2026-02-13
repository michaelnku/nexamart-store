"use server";

import { prisma } from "@/lib/prisma";
import { CurrentRole } from "@/lib/currentUser";

export async function unlockDeliveryByAdmin(deliveryId: string) {
  const role = await CurrentRole();
  if (role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      isLocked: false,
      otpAttempts: 0,
      lockedAt: null,
    },
  });

  return { success: true };
}
