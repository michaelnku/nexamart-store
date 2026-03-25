UPDATE "LedgerEntry"
SET "accountType" = 'REFUND_CLEARING'
WHERE "entryType" = 'REFUND'
  AND "accountType" = 'ESCROW'
  AND (
    reference LIKE 'dispute-refund-%-ledger-%'
    OR reference LIKE 'hub-timeout-refund-%-ledger-%'
    OR reference LIKE 'seller-cancel-refund-%-ledger-%'
  );
