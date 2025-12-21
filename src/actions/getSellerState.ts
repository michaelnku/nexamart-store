"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";

export async function getSellerStats() {
  const user = await CurrentUser();

  if (!user || user.role !== "SELLER") {
    throw new Error("Unauthorized");
  }

  const store = await prisma.store.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      isVerified: true,
      isSuspended: true,
    },
  });

  if (!store) {
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      lowStockCount: 0,
      pendingPayouts: 0,
      isStoreVerified: false,
    };
  }

  const [
    totalProducts,
    totalOrders,
    totalRevenue,
    lowStockCount,
    pendingPayouts,
  ] = await Promise.all([
    //total product
    prisma.product.count({
      where: {
        storeId: store.id,
        isPublished: true,
      },
    }),

    //total seller orders
    prisma.orderSellerGroup.count({
      where: {
        sellerId: user.id,
      },
    }),

    //completed revenue
    prisma.orderSellerGroup.aggregate({
      where: {
        sellerId: user.id,
        payoutStatus: "COMPLETED",
      },
      _sum: {
        subtotal: true,
      },
    }),

    //  Low-stock variants
    prisma.productVariant.count({
      where: {
        product: { storeId: store.id },
        stock: { lt: 5 },
      },
    }),

    //  Pending payouts
    prisma.orderSellerGroup.count({
      where: {
        sellerId: user.id,
        payoutStatus: "PENDING",
      },
    }),
  ]);

  return {
    totalProducts,
    totalOrders,
    totalRevenue: totalRevenue._sum.subtotal ?? 0,
    lowStockCount,
    pendingPayouts,
    isStoreVerified: store.isVerified,
    isStoreSuspended: store.isSuspended,
  };
}
