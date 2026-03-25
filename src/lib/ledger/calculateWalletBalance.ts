import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { AccountTypeValue } from "@/lib/ledger/types";

function buildWalletBalanceWhereInput(
  walletId: string,
  direction: "CREDIT" | "DEBIT",
  accountType?: AccountTypeValue,
): Prisma.LedgerEntryWhereInput {
  if (!accountType) {
    return {
      walletId,
      direction,
    };
  }

  return {
    walletId,
    direction,
    ...buildAccountTypeFilter(accountType),
  };
}

export async function calculateWalletBalance(
  walletId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  const [creditsAgg, debitsAgg] = await Promise.all([
    client.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: buildWalletBalanceWhereInput(walletId, "CREDIT"),
    }),
    client.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: buildWalletBalanceWhereInput(walletId, "DEBIT"),
    }),
  ]);

  const totalCredits = creditsAgg._sum?.amount ?? 0;
  const totalDebits = debitsAgg._sum?.amount ?? 0;

  return totalCredits - totalDebits;
}

function buildAccountTypeFilter(accountType: AccountTypeValue) {
  if (accountType === "ESCROW") {
    return {
      OR: [{ accountType }, { accountType: null }],
    } satisfies Prisma.LedgerEntryWhereInput;
  }

  return {
    accountType,
  } satisfies Prisma.LedgerEntryWhereInput;
}

export async function calculateWalletBalanceByAccountType(
  walletId: string,
  accountType: AccountTypeValue,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  const [creditsAgg, debitsAgg] = await Promise.all([
    client.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: buildWalletBalanceWhereInput(walletId, "CREDIT", accountType),
    }),
    client.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: buildWalletBalanceWhereInput(walletId, "DEBIT", accountType),
    }),
  ]);

  const totalCredits = creditsAgg._sum?.amount ?? 0;
  const totalDebits = debitsAgg._sum?.amount ?? 0;

  return totalCredits - totalDebits;
}

export async function recalculateWalletFromLedger(walletId: string) {
  const entries = await prisma.ledgerEntry.groupBy({
    by: ["direction"],
    where: { walletId },
    _sum: { amount: true },
  });

  const credit =
    entries.find((item) => item.direction === "CREDIT")?._sum.amount ?? 0;
  const debit =
    entries.find((item) => item.direction === "DEBIT")?._sum.amount ?? 0;

  const calculatedBalance = credit - debit;

  await prisma.wallet.update({
    where: { id: walletId },
    data: { balance: calculatedBalance },
  });

  return calculatedBalance;
}

export async function calculateWalletPending(userId: string) {
  const held = await prisma.escrowLedger.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      status: "HELD",
      role: { in: ["SELLER", "RIDER"] },
      entryType: { in: ["SELLER_EARNING", "RIDER_EARNING"] },
    },
  });

  return held._sum.amount ?? 0;
}
