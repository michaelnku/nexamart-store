"use client";

import {
  getBuyerWalletAction,
  getRiderWalletAction,
  getSellerWalletAction,
} from "@/actions/wallet/wallet";
import { WithdrawalDTO, WalletTransaction } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { SharedWalletData, WalletRole } from "@/types/wallet";
import { WALLET_ROLE_CONFIG } from "@/lib/wallet/walletRoleConfig";

function normalizeWallet(data: unknown): SharedWalletData {
  const raw = (data ?? {}) as {
    id?: string;
    balance?: number;
    pending?: number;
    totalEarnings?: number;
    currency?: string;
    transactions?: WalletTransaction[];
    withdrawals?: WithdrawalDTO[];
  };

  return {
    id: raw.id,
    balance: raw.balance ?? 0,
    pending: raw.pending ?? 0,
    totalEarnings: raw.totalEarnings ?? 0,
    currency: raw.currency ?? "USD",
    transactions: raw.transactions ?? [],
    withdrawals: raw.withdrawals ?? [],
  };
}

export function useWallet(role: WalletRole) {
  return useQuery<SharedWalletData>({
    queryKey: ["wallet", role],
    queryFn: async () => {
      const response =
        role === "buyer"
          ? await getBuyerWalletAction()
          : role === "seller"
            ? await getSellerWalletAction()
            : await getRiderWalletAction();

      const normalized = normalizeWallet(response);
      const allowedTypes = WALLET_ROLE_CONFIG[role].visibleTypes;

      return {
        ...normalized,
        transactions: normalized.transactions.filter((tx) =>
          allowedTypes.includes(tx.type),
        ),
      };
    },
    staleTime: 1000 * 60,
    refetchInterval: role === "buyer" ? 1000 * 60 : undefined,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useBuyerWallet() {
  return useWallet("buyer");
}

export function useSellerWallet() {
  return useWallet("seller");
}

export function useRiderWallet() {
  return useWallet("rider");
}
