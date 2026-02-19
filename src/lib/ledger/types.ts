export type LedgerDirectionValue = "CREDIT" | "DEBIT";

export type LedgerEntryTypeValue =
  | "ESCROW_DEPOSIT"
  | "ESCROW_RELEASE"
  | "SELLER_PAYOUT"
  | "RIDER_PAYOUT"
  | "REFUND"
  | "PLATFORM_FEE"
  | "WALLET_TOPUP"
  | "WALLET_WITHDRAWAL";

export type EscrowRoleValue = "BUYER" | "SELLER" | "RIDER" | "PLATFORM";

export type EscrowEntryTypeValue =
  | "FUND"
  | "SELLER_EARNING"
  | "RIDER_EARNING"
  | "PLATFORM_COMMISSION"
  | "RELEASE"
  | "REFUND";

export type EscrowStatusValue = "PENDING" | "HELD" | "RELEASED" | "CANCELLED";
