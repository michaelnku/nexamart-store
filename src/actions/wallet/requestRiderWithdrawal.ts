"use server";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { approveRiderWithdrawalCore } from "@/actions/admin/approveRiderWithdrawal";

const MIN_RIDER_WITHDRAWAL_USD = 5;

type RiderWithdrawalRequestResult =
  | {
      success: true;
      withdrawalId: string;
      status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED" | "COMPLETED";
      amount: number;
      autoApproved: boolean;
    }
  | {
      success: false;
      code:
        | "UNAUTHORIZED"
        | "FORBIDDEN"
        | "INVALID_AMOUNT"
        | "WALLET_NOT_FOUND"
        | "MISSING_STRIPE_ACCOUNT"
        | "INSUFFICIENT_BALANCE";
      message: string;
    };

export async function requestRiderWithdrawalAction(
  amount: number,
): Promise<RiderWithdrawalRequestResult> {
  const [userId, role] = await Promise.all([CurrentUserId(), CurrentRole()]);

  if (!userId) {
    return { success: false, code: "UNAUTHORIZED", message: "Unauthorized" };
  }

  if (role !== "RIDER") {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Only riders can request this withdrawal.",
    };
  }

  if (!Number.isFinite(amount) || amount < MIN_RIDER_WITHDRAWAL_USD) {
    return {
      success: false,
      code: "INVALID_AMOUNT",
      message: `Minimum rider withdrawal is $${MIN_RIDER_WITHDRAWAL_USD}.`,
    };
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      id: true,
      balance: true,
      user: {
        select: {
          riderProfile: {
            select: {
              stripeAccountId: true,
            },
          },
        },
      },
    },
  });

  if (!wallet) {
    return {
      success: false,
      code: "WALLET_NOT_FOUND",
      message: "Rider wallet not found.",
    };
  }

  if (!wallet.user.riderProfile?.stripeAccountId) {
    return {
      success: false,
      code: "MISSING_STRIPE_ACCOUNT",
      message: "Connect your Stripe account before requesting a withdrawal.",
    };
  }

  if (amount > wallet.balance) {
    return {
      success: false,
      code: "INSUFFICIENT_BALANCE",
      message: "Withdrawal amount exceeds available rider balance.",
    };
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    const created = await tx.withdrawal.create({
      data: {
        walletId: wallet.id,
        amount,
        method: "STRIPE_CONNECT",
        status: "PENDING",
      },
      select: {
        id: true,
        amount: true,
        status: true,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        userId,
        entryType: "RIDER_PAYOUT",
        direction: "DEBIT",
        amount,
        reference: `rider-withdrawal-${created.id}`,
      },
    });

    return created;
  });

  const autoApprove =
    process.env.AUTO_APPROVE_RIDER_WITHDRAWALS?.toLowerCase() === "true";

  if (!autoApprove) {
    return {
      success: true,
      withdrawalId: withdrawal.id,
      status: withdrawal.status,
      amount: withdrawal.amount,
      autoApproved: false,
    };
  }

  const approval = await approveRiderWithdrawalCore(withdrawal.id, {
    skipRoleCheck: true,
  });

  if (approval.success) {
    return {
      success: true,
      withdrawalId: approval.withdrawalId,
      status: approval.status,
      amount: approval.amount,
      autoApproved: true,
    };
  }

  return {
    success: true,
    withdrawalId: withdrawal.id,
    status: "PENDING",
    amount: withdrawal.amount,
    autoApproved: false,
  };
}
