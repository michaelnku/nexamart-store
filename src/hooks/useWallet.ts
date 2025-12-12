"use client";

import {
  getBuyerWalletAction,
  getSellerWalletAction,
} from "@/actions/wallet/wallet";
import { useQuery } from "@tanstack/react-query";

export function useBuyerWallet() {
  return useQuery({
    queryKey: ["buyer-wallet"],
    queryFn: async () => {
      const wallet = await getBuyerWalletAction();
      return wallet;
    },
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useSellerWallet() {
  return useQuery({
    queryKey: ["seller-wallet"],
    queryFn: async () => {
      const wallet = await getSellerWalletAction();
      return wallet;
    },
    staleTime: 1000 * 60 * 1,
  });
}
