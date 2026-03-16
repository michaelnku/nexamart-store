"use client";

import { useQuery } from "@tanstack/react-query";

import { getEscrowPayoutControl } from "@/actions/admin/getEscrowPayoutControl";

export function useEscrowPayoutControl(params: {
  preset: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [
      "admin-escrow-payout-control",
      params.preset,
      params.startDate,
      params.endDate,
    ],
    queryFn: () => getEscrowPayoutControl(params),
  });
}
