"use server";

import { createAuditLog } from "@/lib/audit/service";
import { CurrentUser, CurrentRole } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { createServiceContext } from "@/lib/system/serviceContext";

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
  const [role, currentUser] = await Promise.all([CurrentRole(), CurrentUser()]);
  if (role !== "ADMIN" || !currentUser) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Only ADMIN can request platform withdrawals.",
    };
  }
  const context = createServiceContext("PLATFORM_WITHDRAWAL_ENGINE");

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      code: "INVALID_AMOUNT",
      message: "Amount must be greater than zero.",
    };
  }

  const availableCommission = await getAvailableReleasedCommission();

  if (amount > availableCommission) {
    return {
      success: false,
      code: "INSUFFICIENT_COMMISSION",
      message: "Requested amount exceeds released platform commission.",
    };
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    const systemAccount = await getOrCreateSystemEscrowAccount(tx);
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
      context,
    });

    return created;
  });

  await createAuditLog({
    actorId: currentUser.id,
    actorRole: currentUser.role,
    actionType: "PLATFORM_WITHDRAWAL_REQUESTED",
    targetEntityType: "WITHDRAWAL",
    targetEntityId: withdrawal.id,
    summary: "Requested a platform treasury withdrawal.",
    metadata: {
      amount: withdrawal.amount,
      availableCommission,
    },
  });

  return {
    success: true,
    withdrawalId: withdrawal.id,
    status: "PENDING",
    amount: withdrawal.amount,
    availableCommission,
  };
}
