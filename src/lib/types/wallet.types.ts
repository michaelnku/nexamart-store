import {
  TransactionStatus,
  TransactionType,
  WithdrawalStatus,
} from "@/generated/prisma/client";

export type WalletTransactionType =
  | "DEPOSIT"
  | "REFUND"
  | "EARNING"
  | "ORDER_PAYMENT"
  | "WITHDRAWAL"
  | "SELLER_PAYOUT"
  | "RIDER_PAYOUT";

export type WalletTransactionStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "CANCELLED";

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  orderId?: string | null;
  reference?: string | null;
  description?: string | null;
  source?: "transaction" | "pending-payout";
  createdAt: string | Date;
  activityAt?: string | Date;
  eligibleAt?: string | Date | null;
  deliveredAt?: string | Date | null;
};

export type TransactionDTO = {
  id: string;
  walletId?: string | null;
  orderId?: string | null;
  userId?: string | null;
  type: TransactionType;
  amount: number;
  reference?: string | null;
  description?: string | null;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
};

export type WithdrawalDTO = {
  id: string;
  walletId: string;
  amount: number;
  method?: string | null;
  accountInfo?: string | null;
  status: WithdrawalStatus;
  processedAt?: string | null;
  createdAt: string;
};

export type SellerWalletDTO = {
  balance: number;
  pending: number;
  totalEarnings: number;
  currency?: string;
  withdrawals: WithdrawalDTO[];
};

export type BuyerWallet = {
  id: string;
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
};
