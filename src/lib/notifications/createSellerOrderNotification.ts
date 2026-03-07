import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/createNotification";

export async function createSellerOrderNotification(
  sellerId: string,
  orderId: string,
) {
  const lastBatch = await prisma.notification.findFirst({
    where: {
      userId: sellerId,
      type: "ORDER_BATCH",
      createdAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (lastBatch) {
    const match = lastBatch.message.match(/\d+/);
    const count = match ? parseInt(match[0]) : 1;

    return prisma.notification.update({
      where: { id: lastBatch.id },
      data: {
        message: `You received ${count + 1} new orders`,
      },
    });
  }

  return createNotification({
    userId: sellerId,
    title: "New Orders",
    message: "You received 1 new order",
    type: "ORDER_BATCH",
    link: "/marketplace/dashboard/seller/orders",
    key: `seller-order-batch-${sellerId}-${Date.now()}`,
  });
}
