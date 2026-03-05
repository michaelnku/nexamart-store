"use client";

import { useQuery } from "@tanstack/react-query";
import { getSellerSalesReport } from "@/actions/seller/getSellerSalesReport";

export function useSellerSalesReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["seller-sales-report", startDate, endDate],
    queryFn: () =>
      getSellerSalesReport({
        startDate,
        endDate,
      }),
  });
}
