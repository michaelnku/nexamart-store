import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function rebuildWalletBalances() {
  const wallets = await prisma.wallet.findMany({
    select: { id: true },
  });

  let updated = 0;

  for (const wallet of wallets) {
    const entries = await prisma.ledgerEntry.groupBy({
      by: ["direction"],
      where: { walletId: wallet.id },
      _sum: { amount: true },
    });

    const credit =
      entries.find((item) => item.direction === "CREDIT")?._sum.amount ?? 0;
    const debit =
      entries.find((item) => item.direction === "DEBIT")?._sum.amount ?? 0;
    const balance = credit - debit;

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance },
    });

    updated += 1;
  }

  console.log(`Rebuilt wallet balances for ${updated} wallets.`);
}

rebuildWalletBalances()
  .catch((error) => {
    console.error("Failed to rebuild wallet balances:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
