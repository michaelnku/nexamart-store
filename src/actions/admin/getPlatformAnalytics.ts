"use server";

import { UserRole } from "@/generated/prisma";

import { CurrentUser } from "@/lib/currentUser";
import {
  getAdminPlatformAnalytics,
  PlatformAnalyticsResponse,
} from "@/lib/services/admin/adminPlatformAnalyticsService";
import { normalizeAnalyticsDateRange } from "@/lib/analytics/date-range";

export async function getPlatformAnalytics(params?: {
  preset?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<PlatformAnalyticsResponse> {
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

  return getAdminPlatformAnalytics(range);
}
