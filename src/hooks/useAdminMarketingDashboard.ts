"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminMarketingDashboardAction } from "@/actions/admin/getAdminMarketingDashboard";

export function useAdminMarketingDashboard(params: {
  preset: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [
      "admin-marketing-dashboard",
      params.preset,
      params.startDate,
      params.endDate,
    ],
    queryFn: () => getAdminMarketingDashboardAction(params),
  });
}
