import { Prisma } from "@/generated/prisma";
import { createLedgerEntryIdempotent } from "@/lib/ledger/idempotentEntries";
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

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount for double-entry ledger");
  }

  const [fromWalletId, toWalletId] = await Promise.all([
    input.resolveFromWallet === false
      ? input.fromWalletId
      : ensureWalletId(tx, input.fromWalletId, input.fromUserId),
    input.resolveToWallet === false
      ? input.toWalletId
      : ensureWalletId(tx, input.toWalletId, input.toUserId),
  ]);

  const debitRef = `${input.reference}-debit`;
  const creditRef = `${input.reference}-credit`;

  const [existingDebit, existingCredit] = await Promise.all([
    tx.ledgerEntry.findUnique({
      where: { reference: debitRef },
      select: { id: true },
    }),
    tx.ledgerEntry.findUnique({
      where: { reference: creditRef },
      select: { id: true },
    }),
  ]);

  if (!existingDebit && fromWalletId && !input.allowNegativeFromWallet) {
    const sourceWallet = await tx.wallet.findUnique({
      where: { id: fromWalletId },
      select: { id: true, balance: true },
    });
    if (!sourceWallet) {
      throw new Error("Source wallet not found");
    }
    if (sourceWallet.balance < amount) {
      throw new Error("Insufficient wallet balance for debit ledger entry");
    }
  }

  const debitCreate = await createLedgerEntryIdempotent(tx, {
    orderId: input.orderId,
    userId: input.fromUserId,
    walletId: fromWalletId,
    entryType: input.entryType,
    direction: "DEBIT",
    amount,
    reference: debitRef,
  });

  const creditCreate = await createLedgerEntryIdempotent(tx, {
    orderId: input.orderId,
    userId: input.toUserId,
    walletId: toWalletId,
    entryType: input.entryType,
    direction: "CREDIT",
    amount,
    reference: creditRef,
  });

  // wallet.balance is a cached projection of LedgerEntry.
  // We only mutate cached balance when an entry is newly created in this tx.
  if (debitCreate.created && fromWalletId) {
    await tx.wallet.update({
      where: { id: fromWalletId },
      data: { balance: { decrement: amount } },
    });
  }

  if (creditCreate.created && toWalletId) {
    await tx.wallet.update({
      where: { id: toWalletId },
      data: { balance: { increment: amount } },
    });
  }

  const pair = await tx.ledgerEntry.findMany({
    where: { reference: { in: [debitRef, creditRef] } },
    select: { reference: true, direction: true, amount: true },
  });

  const debit = pair.find((item) => item.reference === debitRef);
  const credit = pair.find((item) => item.reference === creditRef);
  if (!debit || !credit) {
    throw new Error("Incomplete double-entry ledger pair");
  }
  if (debit.amount !== credit.amount) {
    throw new Error("Ledger imbalance detected");
  }

  return { debitReference: debitRef, creditReference: creditRef };
}
