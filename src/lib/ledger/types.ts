export type LedgerDirectionValue = "CREDIT" | "DEBIT";
export type AccountTypeValue = "ESCROW" | "PLATFORM" | "REFERRAL";

export type LedgerEntryTypeValue =
  | "ESCROW_DEPOSIT"
  | "ESCROW_RELEASE"
  | "SELLER_PAYOUT"
  | "RIDER_PAYOUT"
  | "REFUND"
  | "BUYER_CREDIT"
  | "REFERRAL_BONUS"
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
