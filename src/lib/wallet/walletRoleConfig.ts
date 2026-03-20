import { WalletTransactionType } from "@/lib/types";
import { WalletRole } from "@/types/wallet";

export type WalletRoleConfig = {
  credits: WalletTransactionType[];
  debits: WalletTransactionType[];
  visibleTypes: WalletTransactionType[];
  canFund: boolean;
  withdrawRoute?: string;
  withdrawLabel?: string;
};

export const WALLET_ROLE_CONFIG: Record<WalletRole, WalletRoleConfig> = {
  buyer: {
    credits: ["DEPOSIT", "REFUND", "EARNING"],
    debits: ["ORDER_PAYMENT", "WITHDRAWAL"],
    visibleTypes: [
      "DEPOSIT",
      "REFUND",
      "EARNING",
      "ORDER_PAYMENT",
      "WITHDRAWAL",
    ],
    canFund: true,
  },
  seller: {
    credits: ["SELLER_PAYOUT"],
    debits: ["WITHDRAWAL"],
    visibleTypes: ["SELLER_PAYOUT", "WITHDRAWAL"],
    canFund: false,
    withdrawRoute: "/marketplace/dashboard/seller/wallet/withdraw",
    withdrawLabel: "Withdraw Funds",
  },
  rider: {
    credits: ["RIDER_PAYOUT"],
    debits: ["WITHDRAWAL"],
    visibleTypes: ["RIDER_PAYOUT", "WITHDRAWAL"],
    canFund: false,
    withdrawRoute: "/marketplace/dashboard/rider/wallet/withdraw",
    withdrawLabel: "Withdraw Earnings",
  },
};
