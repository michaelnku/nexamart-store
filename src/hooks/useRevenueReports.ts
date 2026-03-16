"use client";

import { useQuery } from "@tanstack/react-query";

import { getRevenueReports } from "@/actions/admin/getRevenueReports";

export function useRevenueReports(params: {
  preset: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [
      "admin-revenue-reports",
      params.preset,
      params.startDate,
      params.endDate,
    ],
    queryFn: () => getRevenueReports(params),
  });
}
