"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";
import {
  countSellerGroupsInPayoutPipeline,
  countSellerPayoutAdminAttention,
} from "@/lib/services/admin/adminSellerPayoutAttentionService";

export async function getAdminStats() {
  const user = await CurrentUser();

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const [totalUsers, totalProducts, totalRevenue, openAdminAttentionCount, sellerGroupsInPayoutPipeline] =
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

      countSellerPayoutAdminAttention(),

      countSellerGroupsInPayoutPipeline(),
    ]);

  return {
    totalUsers,
    totalProducts,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    openAdminAttentionCount,
    sellerGroupsInPayoutPipeline,
  };
}
