"use server";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";
import { createLedgerEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { approveSellerWithdrawalCore } from "@/actions/admin/approveSellerWithdrawal";

const MIN_WITHDRAWAL_USD = 10;

type RequestWithdrawalResult =
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
        | "MISSING_STRIPE_ACCOUNT"
        | "INVALID_AMOUNT"
        | "INSUFFICIENT_BALANCE"
        | "WALLET_NOT_FOUND";
      message: string;
    };

export async function requestSellerWithdrawalAction(
  amount: number,
): Promise<RequestWithdrawalResult> {
  const [userId, role] = await Promise.all([CurrentUserId(), CurrentRole()]);

  if (!userId) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    };
  }

  if (role !== "SELLER") {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Only sellers can request withdrawals.",
    };
  }

  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_USD) {
    return {
      success: false,
      code: "INVALID_AMOUNT",
      message: `Minimum withdrawal is $${MIN_WITHDRAWAL_USD}.`,
    };
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      id: true,
      user: {
        select: {
          store: {
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
      message: "Seller wallet not found.",
    };
  }

  if (!wallet.user.store?.stripeAccountId) {
    return {
      success: false,
      code: "MISSING_STRIPE_ACCOUNT",
      message: "Connect a Stripe account before requesting withdrawal.",
    };
  }

  const availableBalance = await calculateWalletBalance(wallet.id);
  if (availableBalance < amount) {
    return {
      success: false,
      code: "INSUFFICIENT_BALANCE",
      message: "Insufficient available balance for withdrawal.",
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

    await createLedgerEntryIdempotent(tx, {
      walletId: wallet.id,
      userId,
      entryType: "SELLER_PAYOUT",
      direction: "DEBIT",
      amount,
      reference: `withdrawal-debit-${created.id}`,
    });

    return created;
  });

  const autoApprove =
    process.env.AUTO_APPROVE_WITHDRAWALS?.toLowerCase() === "true";

  if (autoApprove) {
    const approval = await approveSellerWithdrawalCore(withdrawal.id, {
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

  return {
    success: true,
    withdrawalId: withdrawal.id,
    status: withdrawal.status,
    amount: withdrawal.amount,
    autoApproved: false,
  };
}
