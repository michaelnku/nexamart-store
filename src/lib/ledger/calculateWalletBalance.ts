import { prisma } from "@/lib/prisma";

export async function calculateWalletBalance(walletId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    select: { balance: true },
  });

  return wallet?.balance ?? 0;
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
