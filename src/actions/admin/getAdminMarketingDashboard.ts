"use server";

import { UserRole } from "@/generated/prisma";

import { normalizeAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";
import {
  AdminMarketingDashboardResponse,
  getAdminMarketingDashboard,
} from "@/lib/services/admin/adminMarketingService";

export async function getAdminMarketingDashboardAction(params?: {
  preset?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<AdminMarketingDashboardResponse> {
  const user = await CurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }

  const range = normalizeAnalyticsDateRange({
    preset: params?.preset,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });

  return getAdminMarketingDashboard(range);
}
