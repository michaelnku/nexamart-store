"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminTransactionsDashboardAction } from "@/actions/admin/getAdminTransactionsDashboardAction";

export function useAdminTransactionsDashboard(params: {
  preset: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [
      "admin-transactions-dashboard",
      params.preset,
      params.startDate,
      params.endDate,
    ],
    queryFn: () => getAdminTransactionsDashboardAction(params),
  });
}
