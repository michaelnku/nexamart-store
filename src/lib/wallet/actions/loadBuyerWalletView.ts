import { prisma } from "@/lib/prisma";
import {
  calculateWalletBalance,
  calculateWalletPending,
} from "@/lib/ledger/calculateWalletBalance";
import { EMPTY_BUYER_WALLET } from "./walletAction.constants";

export async function loadBuyerWalletView(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!wallet) {
    return EMPTY_BUYER_WALLET;
  }

  const [balance, pending] = await Promise.all([
    calculateWalletBalance(wallet.id),
    calculateWalletPending(userId),
  ]);

  const totalEarnings = wallet.transactions
    .filter((tx) => tx.type === "EARNING" || tx.type === "SELLER_PAYOUT")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    ...wallet,
    balance,
    pending,
    totalEarnings,
  };
}

