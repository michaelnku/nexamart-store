import { AccountTypeValue } from "@/lib/ledger/types";

export const TREASURY_ACCOUNT_TYPE = {
  ESCROW: "ESCROW",
  STORED_VALUE: "STORED_VALUE",
  PLATFORM_REVENUE: "PLATFORM_REVENUE",
  REFERRAL: "REFERRAL",
  REFUND_CLEARING: "REFUND_CLEARING",
} as const satisfies Record<string, AccountTypeValue>;

type TreasuryLedgerRouting = {
  fromAccountType?: AccountTypeValue;
  toAccountType?: AccountTypeValue;
  debitBalanceAccountType?: AccountTypeValue;
  allowNegativeFromWallet?: boolean;
};

export const TREASURY_LEDGER_ROUTING = {
  orderEscrowFunding: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
    toAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
  },
  sellerPayoutRelease: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
    toAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
    debitBalanceAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
  },
  riderPayoutRelease: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
    toAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
    debitBalanceAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
  },
  platformCommissionRelease: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
    toAccountType: TREASURY_ACCOUNT_TYPE.PLATFORM_REVENUE,
    debitBalanceAccountType: TREASURY_ACCOUNT_TYPE.ESCROW,
  },
  walletTopUp: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.STORED_VALUE,
    toAccountType: TREASURY_ACCOUNT_TYPE.STORED_VALUE,
    debitBalanceAccountType: TREASURY_ACCOUNT_TYPE.STORED_VALUE,
    allowNegativeFromWallet: true,
  },
  buyerWalletCredit: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.STORED_VALUE,
    toAccountType: TREASURY_ACCOUNT_TYPE.STORED_VALUE,
    debitBalanceAccountType: TREASURY_ACCOUNT_TYPE.STORED_VALUE,
    allowNegativeFromWallet: true,
  },
  referralReward: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.REFERRAL,
    toAccountType: TREASURY_ACCOUNT_TYPE.REFERRAL,
    debitBalanceAccountType: TREASURY_ACCOUNT_TYPE.REFERRAL,
  },
  platformWithdrawal: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.PLATFORM_REVENUE,
    debitBalanceAccountType: TREASURY_ACCOUNT_TYPE.PLATFORM_REVENUE,
  },
  orderRefundRelease: {
    fromAccountType: TREASURY_ACCOUNT_TYPE.REFUND_CLEARING,
    toAccountType: TREASURY_ACCOUNT_TYPE.REFUND_CLEARING,
    debitBalanceAccountType: TREASURY_ACCOUNT_TYPE.REFUND_CLEARING,
    allowNegativeFromWallet: true,
  },
} as const satisfies Record<string, TreasuryLedgerRouting>;
