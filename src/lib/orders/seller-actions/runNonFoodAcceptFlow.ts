import { prisma } from "@/lib/prisma";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import {
  assertValidTransition,
  normalizeOrderStatus,
} from "@/lib/order/orderLifecycle";

export async function runNonFoodAcceptFlow({
  sellerGroupId,
  orderId,
  orderStatus,
  storeName,
}: {
  sellerGroupId: string;
  orderId: string;
  orderStatus: string;
  storeName: string;
}) {
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
        status: "DISPATCHED_TO_HUB",
        prepTimeMinutes: null,
        readyAt: null,
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
  });
}

