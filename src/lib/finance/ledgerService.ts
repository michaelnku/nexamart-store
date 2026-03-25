import { Prisma } from "@/generated/prisma";
import {
  calculateWalletBalance,
  calculateWalletBalanceByAccountType,
} from "@/lib/ledger/calculateWalletBalance";
import { ServiceContext } from "@/lib/system/serviceContext";
import { AccountTypeValue, LedgerEntryTypeValue } from "@/lib/ledger/types";

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
  fromAccountType?: AccountTypeValue;
  toAccountType?: AccountTypeValue;
  debitBalanceAccountType?: AccountTypeValue;
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
  fromAccountType?: AccountTypeValue;
  toAccountType?: AccountTypeValue;
};

type LedgerRow = ReturnType<typeof buildDoubleEntryLedgerRows>["rows"][number];

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
        accountType: input.fromAccountType,
        entryType: input.entryType,
        direction: "DEBIT" as const,
        amount,
        reference: debitRef,
      },
      {
        orderId: input.orderId,
        userId: input.toUserId,
        walletId: input.toWalletId,
        accountType: input.toAccountType,
        entryType: input.entryType,
        direction: "CREDIT" as const,
        amount,
        reference: creditRef,
      },
    ],
  };
}

function normalizeNullableValue(value: string | null | undefined) {
  return value ?? null;
}

function assertLedgerRowMatchesExpected(
  existing: Pick<
    Prisma.LedgerEntryGetPayload<{
      select: {
        reference: true;
        orderId: true;
        userId: true;
        walletId: true;
        accountType: true;
        entryType: true;
        direction: true;
        amount: true;
      };
    }>,
    | "reference"
    | "orderId"
    | "userId"
    | "walletId"
    | "accountType"
    | "entryType"
    | "direction"
    | "amount"
  >,
  expected: LedgerRow,
) {
  if (
    normalizeNullableValue(existing.orderId) !==
      normalizeNullableValue(expected.orderId) ||
    normalizeNullableValue(existing.userId) !==
      normalizeNullableValue(expected.userId) ||
    normalizeNullableValue(existing.walletId) !==
      normalizeNullableValue(expected.walletId) ||
    normalizeNullableValue(existing.accountType) !==
      normalizeNullableValue(expected.accountType) ||
    existing.entryType !== expected.entryType ||
    existing.direction !== expected.direction ||
    Number(existing.amount) !== Number(expected.amount)
  ) {
    throw new Error(
      `Ledger pair reference ${existing.reference} exists with inconsistent data`,
    );
  }
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
    fromAccountType: input.fromAccountType,
    toAccountType: input.toAccountType,
  });

  const amount = Number(input.amount);
  const existingRows = await tx.ledgerEntry.findMany({
    where: {
      reference: {
        in: [debitRef, creditRef],
      },
    },
    select: {
      reference: true,
      orderId: true,
      userId: true,
      walletId: true,
      accountType: true,
      entryType: true,
      direction: true,
      amount: true,
    },
  });
  const existingByReference = new Map(
    existingRows.map((row) => [row.reference, row]),
  );

  for (const row of rows) {
    const existing = existingByReference.get(row.reference);
    if (existing) {
      assertLedgerRowMatchesExpected(existing, row);
    }
  }

  const missingRows = rows.filter(
    (row) => !existingByReference.has(row.reference),
  );

  if (missingRows.length > 0) {
    await tx.ledgerEntry.createMany({
      data: missingRows,
      skipDuplicates: true,
    });
  }

  const finalRows = await tx.ledgerEntry.findMany({
    where: {
      reference: {
        in: [debitRef, creditRef],
      },
    },
    select: {
      reference: true,
      orderId: true,
      userId: true,
      walletId: true,
      accountType: true,
      entryType: true,
      direction: true,
      amount: true,
    },
  });
  const finalByReference = new Map(
    finalRows.map((row) => [row.reference, row]),
  );

  for (const row of rows) {
    const finalRow = finalByReference.get(row.reference);
    if (!finalRow) {
      throw new Error("Unable to restore complete double-entry ledger pair");
    }
    assertLedgerRowMatchesExpected(finalRow, row);
  }

  const createdFreshPair =
    existingRows.length === 0 && missingRows.length === 2;
  if (createdFreshPair && fromWalletId && !input.allowNegativeFromWallet) {
    const sourceWallet = await tx.wallet.findUnique({
      where: { id: fromWalletId },
      select: { id: true },
    });
    if (!sourceWallet) {
      throw new Error("Source wallet not found");
    }
    const availableBalance = input.debitBalanceAccountType
      ? await calculateWalletBalanceByAccountType(
          fromWalletId,
          input.debitBalanceAccountType,
          tx,
        )
      : await calculateWalletBalance(fromWalletId, tx);
    if (availableBalance < amount) {
      const blendedBalance = await calculateWalletBalance(fromWalletId, tx);
      const [orderFundingEntries, recentCompetingDebits] = await Promise.all([
        input.orderId
          ? tx.ledgerEntry.findMany({
              where: {
                orderId: input.orderId,
                walletId: fromWalletId,
                direction: "CREDIT",
              },
              orderBy: { createdAt: "asc" },
              select: {
                reference: true,
                entryType: true,
                accountType: true,
                amount: true,
              },
              take: 20,
            })
          : Promise.resolve([]),
        tx.ledgerEntry.findMany({
          where: {
            walletId: fromWalletId,
            direction: "DEBIT",
            ...(input.debitBalanceAccountType
              ? { accountType: input.debitBalanceAccountType }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          select: {
            reference: true,
            orderId: true,
            entryType: true,
            accountType: true,
            amount: true,
          },
          take: 20,
        }),
      ]);

      console.error("Ledger debit balance check failed", {
        reference: input.reference,
        orderId: input.orderId ?? null,
        fromWalletId,
        fromUserId: input.fromUserId ?? null,
        entryType: input.entryType,
        amount,
        debitBalanceAccountType: input.debitBalanceAccountType ?? null,
        availableBalance,
        blendedBalance,
        orderFundingEntries,
        recentCompetingDebits,
      });

      throw new Error("Insufficient wallet balance for debit ledger entry");
    }
  }

  if (createdFreshPair) {
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
