"use server";

import { WalletStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { CurrentUser, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  calculateWalletBalance,
  calculateWalletPending,
} from "@/lib/ledger/calculateWalletBalance";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { getOrCreateStripeCustomerForUser } from "@/lib/stripe/getOrCreateStripeCustomer";

const BUYER_WALLET_REVALIDATE_PATHS = [
  "/customer/wallet",
  "/settings",
  "/checkout",
] as const;

const EMPTY_BUYER_WALLET = {
  id: undefined,
  balance: 0,
  pending: 0,
  totalEarnings: 0,
  currency: "USD",
  status: "INACTIVE" as WalletStatus,
  transactions: [],
  withdrawals: [],
};

type ActivateBuyerWalletResult =
  | {
      success: true;
      code: "ACTIVATED" | "ALREADY_ACTIVE";
      walletId: string;
      walletStatus: WalletStatus;
      stripeCustomerId: string;
      createdStripeCustomer: boolean;
      createdWallet: boolean;
    }
  | {
      success: false;
      code:
        | "UNAUTHORIZED"
        | "FORBIDDEN"
        | "ACCOUNT_BLOCKED"
        | "STRIPE_NOT_CONFIGURED";
      message: string;
    };

function revalidateBuyerWalletPaths() {
  for (const path of BUYER_WALLET_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function getBuyerWalletAction() {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) throw new Error("Unauthorized");
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

export async function activateBuyerWalletAction(): Promise<ActivateBuyerWalletResult> {
  const currentUser = await CurrentUser();

  if (!currentUser?.id) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      role: true,
      email: true,
      name: true,
      stripeCustomerId: true,
      isBanned: true,
      isDeleted: true,
      deletedAt: true,
    },
  });

  if (!user) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    };
  }

  if (user.role !== "USER") {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Only buyers can activate a wallet.",
    };
  }

  if (user.isBanned || user.isDeleted || user.deletedAt) {
    return {
      success: false,
      code: "ACCOUNT_BLOCKED",
      message: "This account cannot activate a wallet right now.",
    };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      success: false,
      code: "STRIPE_NOT_CONFIGURED",
      message: "Stripe is not configured.",
    };
  }

  const existingWallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
    },
  });

  const wallet =
    existingWallet ??
    (await prisma.wallet.create({
      data: {
        userId: user.id,
        status: "INACTIVE",
      },
      select: {
        id: true,
        status: true,
      },
    }));

  const stripeCustomer = await getOrCreateStripeCustomerForUser(user.id, {
    user,
  });

  if (wallet.status === "ACTIVE") {
    revalidateBuyerWalletPaths();

    return {
      success: true,
      code: "ALREADY_ACTIVE",
      walletId: wallet.id,
      walletStatus: "ACTIVE",
      stripeCustomerId: stripeCustomer.stripeCustomerId,
      createdStripeCustomer: stripeCustomer.created,
      createdWallet: !existingWallet,
    };
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      status: "ACTIVE",
    },
  });

  revalidateBuyerWalletPaths();

  return {
    success: true,
    code: "ACTIVATED",
    walletId: wallet.id,
    walletStatus: "ACTIVE",
    stripeCustomerId: stripeCustomer.stripeCustomerId,
    createdStripeCustomer: stripeCustomer.created,
    createdWallet: !existingWallet,
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
    include: {
      withdrawals: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!wallet) {
    return {
      balance: 0,
      pending: 0,
      totalEarnings: 0,
      currency: "USD",
      status: "ACTIVE" as WalletStatus,
      withdrawals: [],
      transactions: [],
    };
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
    status: wallet.status,
    withdrawals: wallet.withdrawals,
    transactions: wallet.transactions,
  };
};

export const getRiderWalletAction = async () => {
  const userId = await CurrentUserId();
  const user = await CurrentUser();

  if (!userId) throw new Error("Unauthorized");
  if (user?.role !== "RIDER") return { error: "Forbidden" };

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    include: {
      withdrawals: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!wallet) {
    return {
      balance: 0,
      pending: 0,
      totalEarnings: 0,
      currency: "USD",
      status: "ACTIVE" as WalletStatus,
      withdrawals: [],
      transactions: [],
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
    balance,
    pending,
    totalEarnings: total._sum.amount ?? 0,
    currency: wallet.currency,
    status: wallet.status,
    withdrawals: wallet.withdrawals,
    transactions: wallet.transactions,
  };
};
