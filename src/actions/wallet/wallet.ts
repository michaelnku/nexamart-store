"use server";

import { CurrentUser, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

//buyer wallet action
export async function getBuyerWalletAction() {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Ensure user is a buyer if you differentiate roles
  if (user?.role !== "USER") throw new Error("Not a buyer");

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
    // auto-create wallet for buyer if missing
    const newWallet = await prisma.wallet.create({
      data: { userId },
    });

    return { ...newWallet, transactions: [] };
  }

  return wallet;
}

// Credit wallet (for refunds, manual topups etc)
export async function creditBuyerWalletAction(
  userId: string,
  amount: number,
  description?: string,
  reference?: string
) {
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const wallet = await prisma.wallet.update({
    where: { userId },
    data: { balance: { increment: amount } },
  });

  await prisma.transaction.create({
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

  return wallet;
}

// Debit wallet (for paying orders with wallet later)
export async function debitBuyerWalletAction(
  userId: string,
  amount: number,
  description?: string,
  reference?: string
) {
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  const updated = await prisma.wallet.update({
    where: { userId },
    data: { balance: { decrement: amount } },
  });

  await prisma.transaction.create({
    data: {
      walletId: updated.id,
      userId,
      type: "ORDER_PAYMENT",
      amount,
      description,
      reference,
      status: "SUCCESS",
    },
  });

  return updated;
}

//seller wallet action
export const getSellerWalletAction = async () => {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (user?.role !== "SELLER") return { error: "Forbidden" };

  const wallet = await prisma.wallet.findFirst({
    where: { userId: user.id },
    include: {
      withdrawals: true,
    },
  });

  if (!wallet)
    return { balance: 0, pending: 0, totalEarnings: 0, withdrawals: [] };

  return {
    balance: wallet.balance,
    pending: wallet.pending,
    totalEarnings: wallet.totalEarnings,
    currency: wallet.currency,
    withdrawals: wallet.withdrawals,
  };
};
