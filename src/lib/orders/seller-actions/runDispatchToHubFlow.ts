import { prisma } from "@/lib/prisma";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import {
  assertValidTransition,
  normalizeOrderStatus,
} from "@/lib/order/orderLifecycle";

export async function runDispatchToHubFlow({
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
        expectedAtHub: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });

    await createOrderTimelineIfMissing(
      {
        orderId,
        status: "ACCEPTED",
        message: `Seller ${storeName} has dispatched items to our hub.`,
      },
      tx,
    );
  });
}

