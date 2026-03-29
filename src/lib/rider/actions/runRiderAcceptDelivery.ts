import { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import {
  assertValidTransition,
  normalizeOrderStatus,
} from "@/lib/order/orderLifecycle";
import { errorResponse, successResponse } from "./riderDeliveryAction.responses";
import { loadDeliveryForRiderAccept } from "./riderDeliveryAction.loaders";

export async function runRiderAcceptDelivery({
  deliveryId,
  userId,
}: {
  deliveryId: string;
  userId: string;
}) {
  const delivery = await loadDeliveryForRiderAccept(deliveryId);

  if (!delivery) return errorResponse("Delivery not found");
  if (delivery.riderId !== userId) return errorResponse("Not assigned to rider");
  if (delivery.status !== "ASSIGNED") {
    return errorResponse(`Delivery status ${delivery.status} cannot be accepted`);
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

  return successResponse();
}

