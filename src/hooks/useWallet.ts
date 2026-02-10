"use client";

import {
  getBuyerWalletAction,
  getRiderWalletAction,
  getSellerWalletAction,
} from "@/actions/wallet/wallet";
import { useQuery } from "@tanstack/react-query";
import { BuyerWallet } from "@/lib/types";

export function useBuyerWallet() {
  return useQuery<BuyerWallet>({
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

export function useRiderWallet() {
  return useQuery({
    queryKey: ["rider-wallet"],
    queryFn: async () => {
      const wallet = await getRiderWalletAction();
      return wallet;
    },
    staleTime: 1000 * 60 * 1,
  });
}
