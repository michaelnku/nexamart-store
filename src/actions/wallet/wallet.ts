"use server";

import { CurrentUser, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  calculateWalletBalance,
  calculateWalletPending,
} from "@/lib/ledger/calculateWalletBalance";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";

export async function getBuyerWalletAction() {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) throw new Error("Unauthorized");
  if (user?.role !== "USER") throw new Error("Not a buyer");

  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

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

export async function creditBuyerWalletAction(
  userId: string,
  amount: number,
  description?: string,
  reference?: string,
) {
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.$transaction(async (tx) => {
    const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

    await createDoubleEntryLedger(tx, {
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: userId,
      toWalletId: wallet.id,
      entryType: "REFUND",
      amount,
      reference: reference ?? `buyer-credit-${userId}-${Date.now()}`,
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "DEPOSIT",
        amount,
        description,
        reference,
        status: "SUCCESS",
      },
    });
  });

  return wallet;
}

export async function debitBuyerWalletAction(
  userId: string,
  amount: number,
  description?: string,
  reference?: string,
) {
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const availableBalance = await calculateWalletBalance(wallet.id);
  if (availableBalance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  await prisma.$transaction(async (tx) => {
    const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

    await createDoubleEntryLedger(tx, {
      fromUserId: userId,
      fromWalletId: wallet.id,
      toWalletId: systemEscrowAccount.walletId,
      entryType: "ESCROW_DEPOSIT",
      amount,
      reference: reference ?? `buyer-debit-${userId}-${Date.now()}`,
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "ORDER_PAYMENT",
        amount,
        description,
        reference,
        status: "SUCCESS",
      },
    });
  });

  return wallet;
}

export const getSellerWalletAction = async () => {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) throw new Error("Unauthorized");
  if (user?.role !== "SELLER") return { error: "Forbidden" };

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    include: { withdrawals: true },
  });

  if (!wallet) {
    return { balance: 0, pending: 0, totalEarnings: 0, withdrawals: [] };
  }

  const [balance, pending, total] = await Promise.all([
    calculateWalletBalance(wallet.id),
    calculateWalletPending(user.id),
    prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        walletId: wallet.id,
        entryType: "SELLER_PAYOUT",
        direction: "CREDIT",
      },
    }),
  ]);

  return {
    balance,
    pending,
    totalEarnings: total._sum.amount ?? 0,
    currency: wallet.currency,
    withdrawals: wallet.withdrawals,
  };
};

export const getRiderWalletAction = async () => {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) throw new Error("Unauthorized");
  if (user?.role !== "RIDER") return { error: "Forbidden" };

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    include: { withdrawals: true },
  });

  if (!wallet) {
    return { balance: 0, pending: 0, totalEarnings: 0, withdrawals: [] };
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
    balance,
    pending,
    totalEarnings: total._sum.amount ?? 0,
    currency: wallet.currency,
    withdrawals: wallet.withdrawals,
  };
};
