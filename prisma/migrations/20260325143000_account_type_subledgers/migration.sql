DO $$
BEGIN
  ALTER TYPE "AccountType" RENAME VALUE 'PLATFORM' TO 'PLATFORM_REVENUE';
EXCEPTION
  WHEN invalid_parameter_value THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "AccountType" ADD VALUE 'STORED_VALUE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "AccountType" ADD VALUE 'REFUND_CLEARING';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE "LedgerEntry"
SET "accountType" = 'STORED_VALUE'
WHERE "accountType" IS NULL
  AND "entryType" IN ('WALLET_TOPUP', 'BUYER_CREDIT');

UPDATE "LedgerEntry"
SET "accountType" = 'REFERRAL'
WHERE "accountType" IS NULL
  AND "entryType" = 'REFERRAL_BONUS';

UPDATE "LedgerEntry"
SET "accountType" = 'ESCROW'
WHERE "accountType" IS NULL
  AND "entryType" IN ('ESCROW_DEPOSIT', 'ESCROW_RELEASE', 'SELLER_PAYOUT', 'RIDER_PAYOUT');

UPDATE "LedgerEntry"
SET "accountType" = 'ESCROW'
WHERE "accountType" IS NULL
  AND "entryType" = 'REFUND'
  AND "orderId" IS NOT NULL;
