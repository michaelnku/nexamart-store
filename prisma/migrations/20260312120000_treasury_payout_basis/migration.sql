ALTER TABLE "Delivery"
ADD COLUMN "riderPayoutAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Delivery"
SET "riderPayoutAmount" = "fee"
WHERE "riderPayoutAmount" = 0;
