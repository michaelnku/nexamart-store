import { Prisma } from "@/generated/prisma";
import { createLedgerEntryIdempotent } from "@/lib/ledger/idempotentEntries";

type Tx = Prisma.TransactionClient;

type LedgerEntryType =
  | "ESCROW_DEPOSIT"
  | "ESCROW_RELEASE"
  | "SELLER_PAYOUT"
  | "RIDER_PAYOUT"
  | "REFUND"
  | "PLATFORM_FEE";

type CreateDoubleEntryLedgerInput = {
  orderId?: string;
  fromUserId?: string;
  toUserId?: string;
  fromWalletId?: string;
  toWalletId?: string;
  amount: number;
  entryType: LedgerEntryType;
  reference: string;
  resolveFromWallet?: boolean;
  resolveToWallet?: boolean;
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

  await createLedgerEntryIdempotent(tx, {
    orderId: input.orderId,
    userId: input.fromUserId,
    walletId: fromWalletId,
    entryType: input.entryType,
    direction: "DEBIT",
    amount,
    reference: debitRef,
  });

  await createLedgerEntryIdempotent(tx, {
    orderId: input.orderId,
    userId: input.toUserId,
    walletId: toWalletId,
    entryType: input.entryType,
    direction: "CREDIT",
    amount,
    reference: creditRef,
  });

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
