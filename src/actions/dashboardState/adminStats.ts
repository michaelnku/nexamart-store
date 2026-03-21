"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";

export async function getAdminStats() {
  const user = await CurrentUser();

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const [totalUsers, totalProducts, totalRevenue, pendingPayouts] =
    await Promise.all([
      prisma.user.count(),

      prisma.product.count({
        where: { isPublished: true },
      }),

      prisma.order.aggregate({
        where: {
          isPaid: true,
          status: "DELIVERED",
        },
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.orderSellerGroup.count({
        where: {
          payoutStatus: "PENDING",
        },
      }),
    ]);

  return {
    totalUsers,
    totalProducts,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    pendingReports: pendingPayouts,
  };
}
