"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId, CurrentRole } from "@/lib/currentUser";

export async function getRiderEarningsAction() {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId) return { error: "Unauthorized" };
  if (role !== "RIDER") return { error: "Forbidden" };

  const deliveries = await prisma.delivery.findMany({
    where: {
      riderId: userId,
    },
    select: {
      id: true,
      fee: true,
      status: true,
      deliveredAt: true,
      payoutEligibleAt: true,
      order: {
        select: {
          id: true,
          trackingNumber: true,
          createdAt: true,
          status: true,
        },
      },
    },
    orderBy: {
      deliveredAt: "desc",
    },
    take: 50,
  });

  const totalEarnings = deliveries.reduce((sum, d) => sum + (d.fee ?? 0), 0);

  const pendingEscrow = deliveries
    .filter((d) => d.status === "DELIVERED" && d.payoutEligibleAt !== null)
    .reduce((sum, d) => sum + (d.fee ?? 0), 0);

  const completed = deliveries
    .filter((d) => d.status === "DELIVERED")
    .reduce((sum, d) => sum + (d.fee ?? 0), 0);

  return {
    totalEarnings,
    pendingEscrow,
    completed,
    deliveries: deliveries.map((d) => ({
      id: d.id,
      orderId: d.order.id,
      trackingNumber: d.order.trackingNumber,
      createdAt: d.order.createdAt,
      deliveredAt: d.deliveredAt,
      fee: d.fee,
      status: d.status,
      payoutEligibleAt: d.payoutEligibleAt,
    })),
  };
}
