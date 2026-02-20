import { prisma } from "@/lib/prisma";
import { autoAssignRider } from "@/lib/rider/logistics";
import { addOrderTimelineOnce } from "@/lib/order/timeline";

export async function evaluateOrderForDispatch(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      isFoodOrder: true,
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
    (group) => group.status === "ARRIVED_AT_HUB",
  ).length;
  const totalCount = activeGroups.length;

  if (arrivedCount === totalCount) {
    await addOrderTimelineOnce({
      orderId,
      status: "SHIPPED",
      message: "All available items have arrived. Preparing for delivery.",
    });
    await autoAssignRider(orderId);
    return;
  }

  await addOrderTimelineOnce({
    orderId,
    status: "SHIPPED",
    message: `${arrivedCount} of ${totalCount} seller shipments have arrived at the hub.`,
  });
}
