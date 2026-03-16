"use server";

import { UserRole } from "@/generated/prisma";

import { normalizeAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";
import {
  type AdminDisputesDashboardResponse,
  getAdminDisputesDashboard,
} from "@/lib/services/admin/adminDisputesService";

export async function getAdminDisputesDashboardAction(params?: {
  preset?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<AdminDisputesDashboardResponse> {
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

  return getAdminDisputesDashboard(range);
}
