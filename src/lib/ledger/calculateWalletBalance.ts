import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const CREDIT_ENTRY_TYPES = [
  "WALLET_TOPUP",
  "REFUND",
  "BUYER_CREDIT",
  "REFERRAL_BONUS",
  "ESCROW_RELEASE",
] as const;

const DEBIT_ENTRY_TYPES = ["ESCROW_DEPOSIT", "WALLET_WITHDRAWAL"] as const;

export async function calculateWalletBalance(
  walletId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  const [creditsAgg, debitsAgg] = await Promise.all([
    client.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        walletId,
        direction: "CREDIT",
        entryType: {
          in: CREDIT_ENTRY_TYPES,
        },
      },
    }),
    client.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        walletId,
        direction: "DEBIT",
        entryType: {
          in: DEBIT_ENTRY_TYPES,
        },
      },
    }),
  ]);

  const totalCredits = creditsAgg._sum.amount ?? 0;
  const totalDebits = debitsAgg._sum.amount ?? 0;

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
