import { WalletStatus } from "@/generated/prisma/client";
import { WithdrawalDTO, WalletTransaction } from "@/lib/types";

export type WalletRole = "buyer" | "seller" | "rider";

export type SharedWalletData = {
  id?: string;
  balance: number;
  pending: number;
  totalEarnings: number;
  currency: string;
  status: WalletStatus;
  transactions: WalletTransaction[];
  withdrawals: WithdrawalDTO[];
};
