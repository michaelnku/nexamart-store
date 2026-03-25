import { Prisma } from "@/generated/prisma";
import { calculateWalletBalanceByAccountType } from "@/lib/ledger/calculateWalletBalance";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { TREASURY_ACCOUNT_TYPE } from "@/lib/ledger/treasurySubledgers";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

export type StoredValueReconciliationSnapshot = {
  treasuryWalletId: string;
  treasuryStoredValueBalanceRaw: number;
  treasuryStoredValueLiability: number;
  aggregateUserWalletLiability: number;
  delta: number;
};

export async function getStoredValueReconciliationSnapshot(
  tx?: Tx,
): Promise<StoredValueReconciliationSnapshot> {
  const client = tx ?? prisma;
  const treasuryAccount = await getOrCreateSystemEscrowAccount(client);
  const treasuryStoredValueBalanceRaw = tx
    ? await calculateWalletBalanceByAccountType(
        treasuryAccount.walletId,
        TREASURY_ACCOUNT_TYPE.STORED_VALUE,
        tx,
      )
    : await calculateWalletBalanceByAccountType(
        treasuryAccount.walletId,
        TREASURY_ACCOUNT_TYPE.STORED_VALUE,
      );

  const liabilityRows = await client.$queryRaw<Array<{ total: number | null }>>(
    Prisma.sql`
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN le.direction = 'CREDIT' THEN le.amount
              WHEN le.direction = 'DEBIT' THEN -le.amount
              ELSE 0
            END
          ),
          0
        )::double precision AS total
      FROM "LedgerEntry" le
      INNER JOIN "Wallet" w ON w.id = le."walletId"
      INNER JOIN "User" u ON u.id = w."userId"
      WHERE u."isSystemUser" = false
    `,
  );

  // Treasury stored-value entries are liability-signed opposite to user-wallet
  // balances, so negate the treasury ledger balance for reconciliation.
  const treasuryStoredValueLiability = Number(
    (-treasuryStoredValueBalanceRaw).toFixed(2),
  );
  const aggregateUserWalletLiability = Number(
    (liabilityRows[0]?.total ?? 0).toFixed(2),
  );

  return {
    treasuryWalletId: treasuryAccount.walletId,
    treasuryStoredValueBalanceRaw: Number(
      treasuryStoredValueBalanceRaw.toFixed(2),
    ),
    treasuryStoredValueLiability,
    aggregateUserWalletLiability,
    delta: Number(
      (treasuryStoredValueLiability - aggregateUserWalletLiability).toFixed(2),
    ),
  };
}
