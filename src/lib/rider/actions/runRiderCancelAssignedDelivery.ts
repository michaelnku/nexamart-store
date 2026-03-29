import { prisma } from "@/lib/prisma";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { errorResponse, successResponse } from "./riderDeliveryAction.responses";
import { loadDeliveryForRiderCancel } from "./riderDeliveryAction.loaders";

export async function runRiderCancelAssignedDelivery({
  deliveryId,
  userId,
}: {
  deliveryId: string;
  userId: string;
}) {
  const delivery = await loadDeliveryForRiderCancel(deliveryId);

  if (!delivery) return errorResponse("Delivery not found");
  if (delivery.riderId !== userId) return errorResponse("Not assigned to rider");
  if (delivery.status !== "ASSIGNED") {
    return errorResponse(`Delivery status ${delivery.status} cannot be cancelled`);
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

  return successResponse();
}

