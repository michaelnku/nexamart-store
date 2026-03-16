"use client";

import { useQuery } from "@tanstack/react-query";

import { getOperationsAnalytics } from "@/actions/admin/getOperationsAnalytics";

export function useOperationsAnalytics(params: {
  preset: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [
      "admin-operations-analytics",
      params.preset,
      params.startDate,
      params.endDate,
    ],
    queryFn: () => getOperationsAnalytics(params),
  });
}
