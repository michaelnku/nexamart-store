CREATE TYPE "AccountType" AS ENUM ('ESCROW', 'PLATFORM', 'REFERRAL');

ALTER TABLE "LedgerEntry"
ADD COLUMN "accountType" "AccountType";
