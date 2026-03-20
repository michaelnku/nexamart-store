import { Prisma } from "@/generated/prisma";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";
import { ServiceContext } from "@/lib/system/serviceContext";
import { LedgerEntryTypeValue } from "@/lib/ledger/types";

type Tx = Prisma.TransactionClient;

type CreateDoubleEntryLedgerInput = {
  orderId?: string;
  fromUserId?: string;
  toUserId?: string;
  fromWalletId?: string;
  toWalletId?: string;
  amount: number;
  entryType: LedgerEntryTypeValue;
  reference: string;
  resolveFromWallet?: boolean;
  resolveToWallet?: boolean;
  allowNegativeFromWallet?: boolean;
  context?: ServiceContext;
};

type DoubleEntryLedgerRowsInput = {
  orderId?: string;
  fromUserId?: string;
  toUserId?: string;
  fromWalletId?: string;
  toWalletId?: string;
  amount: number;
  entryType: LedgerEntryTypeValue;
  reference: string;
};

export function buildDoubleEntryLedgerRows(input: DoubleEntryLedgerRowsInput) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount for double-entry ledger");
  }

  const debitRef = `${input.reference}-debit`;
  const creditRef = `${input.reference}-credit`;

  return {
    debitRef,
    creditRef,
    rows: [
      {
        orderId: input.orderId,
        userId: input.fromUserId,
        walletId: input.fromWalletId,
        entryType: input.entryType,
        direction: "DEBIT" as const,
        amount,
        reference: debitRef,
      },
      {
        orderId: input.orderId,
        userId: input.toUserId,
        walletId: input.toWalletId,
        entryType: input.entryType,
        direction: "CREDIT" as const,
        amount,
        reference: creditRef,
      },
    ],
  };
}

async function ensureWalletId(
  tx: Tx,
  walletId: string | undefined,
  userId: string | undefined,
): Promise<string | undefined> {
  if (walletId) return walletId;
  if (!userId) return undefined;

  const wallet = await tx.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });

  return wallet.id;
}

export async function createDoubleEntryLedger(
  tx: Tx,
  input: CreateDoubleEntryLedgerInput,
) {
  if (!input.reference || !input.reference.trim()) {
    throw new Error("Reference is required for ledger idempotency");
  }

  const [fromWalletId, toWalletId] = await Promise.all([
    input.resolveFromWallet === false
      ? input.fromWalletId
      : ensureWalletId(tx, input.fromWalletId, input.fromUserId),
    input.resolveToWallet === false
      ? input.toWalletId
      : ensureWalletId(tx, input.toWalletId, input.toUserId),
  ]);

  const { debitRef, creditRef, rows } = buildDoubleEntryLedgerRows({
    orderId: input.orderId,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    fromWalletId,
    toWalletId,
    amount: input.amount,
    entryType: input.entryType,
    reference: input.reference,
  });

  const amount = Number(input.amount);
  const inserted = await tx.ledgerEntry.createMany({
    data: rows,
    skipDuplicates: true,
  });

  if (inserted.count === 1) {
    throw new Error("Incomplete double-entry ledger pair");
  }

  if (inserted.count === 2 && fromWalletId && !input.allowNegativeFromWallet) {
    const sourceWallet = await tx.wallet.findUnique({
      where: { id: fromWalletId },
      select: { id: true },
    });
    if (!sourceWallet) {
      throw new Error("Source wallet not found");
    }
    const availableBalance = await calculateWalletBalance(fromWalletId, tx);
    if (availableBalance < amount) {
      throw new Error("Insufficient wallet balance for debit ledger entry");
    }
  }

  // Wallet cache fields are display/reconciliation projections of the ledger.
  // Keep cache writes here limited to sync after authoritative ledger entries land.
  if (inserted.count === 2) {
    await Promise.all([
      fromWalletId
        ? tx.wallet.update({
            where: { id: fromWalletId },
            data: { balance: { decrement: amount } },
          })
        : Promise.resolve(),
      toWalletId
        ? tx.wallet.update({
            where: { id: toWalletId },
            data: { balance: { increment: amount } },
          })
        : Promise.resolve(),
    ]);
  }

  return { debitReference: debitRef, creditReference: creditRef };
}
