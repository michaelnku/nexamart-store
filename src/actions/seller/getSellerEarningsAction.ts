"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId, CurrentRole } from "@/lib/currentUser";

export async function getSellerEarningsAction() {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId) return { error: "Unauthorized" };
  if (role !== "SELLER") return { error: "Forbidden" };

  const sellerGroups = await prisma.orderSellerGroup.findMany({
    where: {
      sellerId: userId,
    },
    select: {
      id: true,
      subtotal: true,
      platformCommission: true,
      sellerRevenue: true,
      payoutStatus: true,
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
      order: { createdAt: "desc" },
    },
    take: 50,
  });

  const totalRevenue = sellerGroups.reduce(
    (sum, g) => sum + (g.subtotal ?? 0),
    0,
  );

  const totalEarnings = sellerGroups.reduce(
    (sum, g) => sum + (g.sellerRevenue ?? 0),
    0,
  );

  const pendingEscrow = sellerGroups
    .filter(
      (g) =>
        g.payoutStatus === "PENDING" &&
        g.order.status !== "CANCELLED",
    )
    .reduce((sum, g) => sum + (g.sellerRevenue ?? 0), 0);

  const released = sellerGroups
    .filter((g) => g.payoutStatus === "COMPLETED")
    .reduce((sum, g) => sum + (g.sellerRevenue ?? 0), 0);

  return {
    totalRevenue,
    totalEarnings,
    pendingEscrow,
    released,
    groups: sellerGroups.map((g) => ({
      id: g.id,
      orderId: g.order.id,
      trackingNumber: g.order.trackingNumber,
      createdAt: g.order.createdAt,
      status: g.order.status,
      revenue: g.subtotal,
      earnings: g.sellerRevenue,
      commission: g.platformCommission,
      payoutStatus: g.payoutStatus,
      payoutEligibleAt: g.payoutEligibleAt,
    })).filter((group) => !(group.status === "CANCELLED" && group.payoutStatus === "PENDING")),
  };
}
