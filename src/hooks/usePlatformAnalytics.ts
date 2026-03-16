"use client";

import { useQuery } from "@tanstack/react-query";

import { getPlatformAnalytics } from "@/actions/admin/getPlatformAnalytics";

export function usePlatformAnalytics(params: {
  preset: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [
      "admin-platform-analytics",
      params.preset,
      params.startDate,
      params.endDate,
    ],
    queryFn: () => getPlatformAnalytics(params),
  });
}
