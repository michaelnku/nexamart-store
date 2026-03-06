"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSellerAnalytics } from "@/actions/seller/getSellerAnalytics";

export function useSellerAnalytics(
  startDate: string,
  endDate: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["seller-analytics", startDate, endDate],
    queryFn: () => fetchSellerAnalytics(startDate, endDate),
    enabled,
  });
}
