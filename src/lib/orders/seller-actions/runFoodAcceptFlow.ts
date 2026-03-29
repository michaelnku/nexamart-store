import { prisma } from "@/lib/prisma";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import {
  assertValidTransition,
  normalizeOrderStatus,
} from "@/lib/order/orderLifecycle";

export async function runFoodAcceptFlow({
  sellerGroupId,
  orderId,
  orderStatus,
  storeName,
  prepTimeMinutes,
}: {
  sellerGroupId: string;
  orderId: string;
  orderStatus: string;
  storeName: string;
  prepTimeMinutes: number;
}) {
  const prepReadyAt = new Date(Date.now() + prepTimeMinutes * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const normalizedOrderStatus = normalizeOrderStatus(orderStatus);
    if (normalizedOrderStatus !== "ACCEPTED") {
      assertValidTransition(normalizedOrderStatus, "ACCEPTED");
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "ACCEPTED" },
    });

    await tx.orderSellerGroup.update({
      where: { id: sellerGroupId },
      data: {
        status: "PREPARING",
        prepTimeMinutes,
        readyAt: prepReadyAt,
      },
    });

    await createOrderTimelineIfMissing(
      {
        orderId,
        status: "ACCEPTED",
        message: `Seller ${storeName} accepted and is preparing your items.`,
      },
      tx,
    );

    await createOrderTimelineIfMissing(
      {
        orderId,
        status: "PREPARING",
        message: `Seller ${storeName} started preparing your order. Estimated ready time is ${prepTimeMinutes} minute${prepTimeMinutes === 1 ? "" : "s"}.`,
      },
      tx,
    );

    await tx.job.upsert({
      where: { id: `mark-ready-${sellerGroupId}` },
      update: {
        type: "MARK_READY",
        status: "PENDING",
        runAt: prepReadyAt,
        attempts: 0,
        lastError: null,
        maxRetries: 5,
        payload: {
          sellerGroupId,
        },
      },
      create: {
        id: `mark-ready-${sellerGroupId}`,
        type: "MARK_READY",
        status: "PENDING",
        runAt: prepReadyAt,
        attempts: 0,
        lastError: null,
        maxRetries: 5,
        payload: {
          sellerGroupId,
        },
      },
    });
  });
}

