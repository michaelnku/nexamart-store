import { prisma } from "@/lib/prisma";
import { autoAssignRider } from "@/lib/rider/logistics";
import { addOrderTimelineOnce } from "@/lib/order/timeline";
import { assertValidTransition, normalizeOrderStatus } from "@/lib/order/orderLifecycle";

export async function evaluateOrderForDispatch(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      isFoodOrder: true,
      status: true,
      sellerGroups: {
        select: { status: true },
      },
    },
  });

  if (!order || order.isFoodOrder) return;

  const activeGroups = order.sellerGroups.filter(
    (group) => group.status !== "CANCELLED",
  );

  if (activeGroups.length === 0) {
    await addOrderTimelineOnce({
      orderId,
      status: "CANCELLED",
      message: "Order cancelled because no items were available for shipment.",
    });
    await prisma.order.updateMany({
      where: { id: orderId, status: { not: "CANCELLED" } },
      data: { status: "CANCELLED" },
    });
    return;
  }

  const arrivedCount = activeGroups.filter(
    (group) =>
      group.status === "VERIFIED_AT_HUB" || group.status === "ARRIVED_AT_HUB",
  ).length;
  const totalCount = activeGroups.length;

  if (arrivedCount === totalCount) {
    const normalizedOrderStatus = normalizeOrderStatus(order.status);
    if (normalizedOrderStatus !== "READY") {
      assertValidTransition(normalizedOrderStatus, "READY");
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "READY" },
      });
    }

    await addOrderTimelineOnce({
      orderId,
      status: "READY",
      message: "All available items have arrived. Preparing for delivery.",
    });
    await autoAssignRider(orderId);
    return;
  }

  await addOrderTimelineOnce({
    orderId,
    status: "ACCEPTED",
    message: `${arrivedCount} of ${totalCount} seller shipments have arrived at the hub.`,
  });
}
