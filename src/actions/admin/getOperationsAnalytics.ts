"use server";

import { UserRole } from "@/generated/prisma";

import { normalizeAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";
import {
  getAdminOperationsAnalytics,
  OperationsAnalyticsResponse,
} from "@/lib/services/admin/adminOperationsAnalyticsService";

export async function getOperationsAnalytics(params?: {
  preset?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<OperationsAnalyticsResponse> {
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

  return getAdminOperationsAnalytics(range);
}
