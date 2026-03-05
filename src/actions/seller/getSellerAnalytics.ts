"use server";

import { UserRole } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { getSellerAnalytics } from "@/lib/services/seller/sellerAnalyticsService";

export async function fetchSellerAnalytics(startDate: string, endDate: string) {
  const user = await CurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== UserRole.SELLER) {
    throw new Error("Forbidden");
  }

  return getSellerAnalytics({
    sellerId: user.id,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });
}
