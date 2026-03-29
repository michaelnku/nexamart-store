import type { WalletStatus } from "@/generated/prisma/client";

export const BUYER_WALLET_REVALIDATE_PATHS = [
  "/customer/wallet",
  "/settings",
  "/checkout",
] as const;

export const EMPTY_BUYER_WALLET = {
  id: undefined,
  balance: 0,
  pending: 0,
  totalEarnings: 0,
  currency: "USD",
  status: "INACTIVE" as WalletStatus,
  transactions: [],
  withdrawals: [],
};

