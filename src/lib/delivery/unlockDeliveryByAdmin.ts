"use server";

import { createAuditLog } from "@/lib/audit/service";
import { CurrentUser, CurrentRole } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function unlockDeliveryByAdmin(deliveryId: string) {
  const [role, currentUser] = await Promise.all([CurrentRole(), CurrentUser()]);
  if (role !== "ADMIN" || !currentUser) {
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

  await createAuditLog({
    actorId: currentUser.id,
    actorRole: currentUser.role,
    actionType: "DELIVERY_UNLOCKED",
    targetEntityType: "DELIVERY",
    targetEntityId: deliveryId,
    summary: "Unlocked a delivery after admin review.",
  });

  return { success: true };
}
