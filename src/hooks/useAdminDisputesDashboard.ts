"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminDisputesDashboardAction } from "@/actions/admin/getAdminDisputesDashboard";

export function useAdminDisputesDashboard(params: {
  preset: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: ["admin-disputes-dashboard", params.preset, params.startDate, params.endDate],
    queryFn: () => getAdminDisputesDashboardAction(params),
  });
}
