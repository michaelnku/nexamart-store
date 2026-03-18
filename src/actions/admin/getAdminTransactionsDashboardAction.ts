"use server";

import { UserRole } from "@/generated/prisma";

import { normalizeAnalyticsDateRange } from "@/lib/analytics/date-range";
import { CurrentUser } from "@/lib/currentUser";
import {
  AdminTransactionsDashboardResponse,
  getAdminTransactionsDashboard,
} from "@/lib/services/admin/adminTransactionsService";

export async function getAdminTransactionsDashboardAction(params?: {
  preset?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<AdminTransactionsDashboardResponse> {
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

  return getAdminTransactionsDashboard(range);
}
