"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminJobsDashboardAction } from "@/actions/admin/getAdminJobsDashboard";

export function useAdminJobsDashboard(params: {
  preset: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [
      "admin-jobs-dashboard",
      params.preset,
      params.startDate,
      params.endDate,
    ],
    queryFn: () => getAdminJobsDashboardAction(params),
  });
}
