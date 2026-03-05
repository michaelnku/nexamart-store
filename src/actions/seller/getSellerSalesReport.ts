"use server";

import { UserRole } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import {
  getSellerSalesStats,
  getSellerSalesBreakdown,
} from "@/lib/services/seller/sellerReportsService";

export async function getSellerSalesReport({
  startDate,
  endDate,
  page = 1,
  limit = 10,
}: {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}) {
  const user = await CurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== UserRole.SELLER) {
    throw new Error("Forbidden");
  }

  const sellerId = user.id;

  const stats = await getSellerSalesStats({
    sellerId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });

  const sales = await getSellerSalesBreakdown({
    sellerId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    page,
    limit,
  });

  return { stats, sales };
}
