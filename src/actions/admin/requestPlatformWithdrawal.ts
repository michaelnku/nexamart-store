"use server";

import { CurrentRole } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

type PlatformWithdrawalRequestResult =
  | {
      success: true;
      withdrawalId: string;
      status: "PENDING";
      amount: number;
      availableCommission: number;
    }
  | {
      success: false;
      code: "UNAUTHORIZED" | "INVALID_AMOUNT" | "INSUFFICIENT_COMMISSION";
      message: string;
    };

async function getAvailableReleasedCommission(): Promise<number> {
  const sums = await prisma.escrowLedger.aggregate({
    _sum: {
      amount: true,
      withdrawnAmount: true,
    },
    where: {
      role: "PLATFORM",
      entryType: "PLATFORM_COMMISSION",
      status: { in: ["RELEASED", "WITHDRAWN"] },
    },
  });

  const total = sums._sum.amount ?? 0;
  const withdrawn = sums._sum.withdrawnAmount ?? 0;
  return Math.max(0, total - withdrawn);
}

export async function requestPlatformWithdrawalAction(
  amount: number,
): Promise<PlatformWithdrawalRequestResult> {
  const role = await CurrentRole();
  if (role !== "ADMIN" && role !== "SYSTEM") {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Only ADMIN or SYSTEM can request platform withdrawals.",
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      code: "INVALID_AMOUNT",
      message: "Amount must be greater than zero.",
    };
  }

  const [availableCommission, systemAccount] = await Promise.all([
    getAvailableReleasedCommission(),
    getOrCreateSystemEscrowAccount(),
  ]);

  if (amount > availableCommission) {
    return {
      success: false,
      code: "INSUFFICIENT_COMMISSION",
      message: "Requested amount exceeds released platform commission.",
    };
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { id: systemAccount.walletId },
      select: { id: true, balance: true },
    });
    if (!wallet) throw new Error("System wallet missing.");
    if (amount > wallet.balance) throw new Error("Insufficient platform wallet balance.");

    const created = await tx.withdrawal.create({
      data: {
        walletId: wallet.id,
        amount,
        method: "STRIPE_TREASURY",
        status: "PENDING",
      },
      select: {
        id: true,
        amount: true,
        status: true,
      },
    });

    await createDoubleEntryLedger(tx, {
      fromUserId: systemAccount.userId,
      fromWalletId: wallet.id,
      entryType: "PLATFORM_FEE",
      amount,
      reference: `platform-withdrawal-debit-${created.id}`,
      resolveFromWallet: false,
      resolveToWallet: false,
    });

    return created;
  });

  return {
    success: true,
    withdrawalId: withdrawal.id,
    status: "PENDING",
    amount: withdrawal.amount,
    availableCommission,
  };
}
