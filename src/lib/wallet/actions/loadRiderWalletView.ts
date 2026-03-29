import { WalletStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateWalletBalance,
  calculateWalletPending,
} from "@/lib/ledger/calculateWalletBalance";
import { getUserTransactionHistory } from "@/lib/wallet/getUserTransactionHistory";

export async function loadRiderWalletView(user: { id: string }) {
  const [wallet, transactions] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: user.id },
      include: {
        withdrawals: true,
      },
    }),
    getUserTransactionHistory({
      userId: user.id,
      role: "rider",
      limit: 50,
    }),
  ]);

  if (!wallet) {
    return {
      id: undefined,
      balance: 0,
      pending: 0,
      totalEarnings: 0,
      currency: "USD",
      status: "ACTIVE" as WalletStatus,
      withdrawals: [],
      transactions,
    };
  }

  const [balance, pending, total] = await Promise.all([
    calculateWalletBalance(wallet.id),
    calculateWalletPending(user.id),
    prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        walletId: wallet.id,
        entryType: "RIDER_PAYOUT",
        direction: "CREDIT",
      },
    }),
  ]);

  return {
    id: wallet.id,
    balance,
    pending,
    totalEarnings: total._sum.amount ?? 0,
    currency: wallet.currency,
    status: wallet.status,
    withdrawals: wallet.withdrawals,
    transactions,
  };
}
