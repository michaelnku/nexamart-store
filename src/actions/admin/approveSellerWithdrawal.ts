"use server";

import { CurrentRole } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

const STRIPE_CURRENCY = "usd";

type ApproveOptions = {
  skipRoleCheck?: boolean;
};

type ApproveWithdrawalResult =
  | {
      success: true;
      withdrawalId: string;
      status: "COMPLETED";
      transferId: string;
      amount: number;
    }
  | {
      success: false;
      code:
        | "UNAUTHORIZED"
        | "NOT_FOUND"
        | "INVALID_STATUS"
        | "MISSING_STRIPE_ACCOUNT"
        | "INSUFFICIENT_BALANCE"
        | "TRANSFER_FAILED";
      message: string;
    };

async function ensureAdmin(skipRoleCheck = false): Promise<boolean> {
  if (skipRoleCheck) return true;
  const role = await CurrentRole();
  return role === "ADMIN";
}

async function moveToProcessing(withdrawalId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.withdrawal.updateMany({
      where: { id: withdrawalId, status: "PENDING" },
      data: { status: "PROCESSING" },
    });
  });
}

async function rejectWithdrawal(withdrawalId: string, reason: string) {
  await prisma.withdrawal.updateMany({
    where: {
      id: withdrawalId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
    data: {
      status: "REJECTED",
      accountInfo: reason,
      processedAt: new Date(),
    },
  });
}

export async function approveSellerWithdrawalCore(
  withdrawalId: string,
  options: ApproveOptions = {},
): Promise<ApproveWithdrawalResult> {
  const isAuthorized = await ensureAdmin(options.skipRoleCheck);
  if (!isAuthorized) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Only admins can approve withdrawals.",
    };
  }

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: {
      wallet: {
        include: {
          user: {
            include: {
              store: {
                select: {
                  stripeAccountId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!withdrawal) {
    return {
      success: false,
      code: "NOT_FOUND",
      message: "Withdrawal not found.",
    };
  }

  if (withdrawal.status === "COMPLETED") {
    const transferId = (() => {
      try {
        const parsed = JSON.parse(withdrawal.accountInfo ?? "{}") as {
          transferId?: string;
        };
        return parsed.transferId ?? "";
      } catch {
        return "";
      }
    })();

    return {
      success: true,
      withdrawalId: withdrawal.id,
      status: "COMPLETED",
      transferId,
      amount: withdrawal.amount,
    };
  }

  if (!["PENDING", "PROCESSING"].includes(withdrawal.status)) {
    return {
      success: false,
      code: "INVALID_STATUS",
      message: "Withdrawal cannot be approved from its current status.",
    };
  }

  const stripeAccountId = withdrawal.wallet.user.store?.stripeAccountId;
  if (!stripeAccountId) {
    return {
      success: false,
      code: "MISSING_STRIPE_ACCOUNT",
      message: "Seller Stripe Connect account is not configured.",
    };
  }

  if (withdrawal.status === "PENDING") {
    await moveToProcessing(withdrawalId);
  }

  const amountInCents = Math.round(withdrawal.amount * 100);

  let transferId: string;
  try {
    const transfer = await stripe.transfers.create(
      {
        amount: amountInCents,
        currency: STRIPE_CURRENCY,
        destination: stripeAccountId,
        metadata: {
          withdrawalId,
          type: "SELLER_WITHDRAWAL",
        },
      },
      {
        idempotencyKey: `withdrawal-${withdrawalId}`,
      },
    );
    transferId = transfer.id;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Stripe transfer failed";
    await rejectWithdrawal(withdrawalId, reason);
    return {
      success: false,
      code: "TRANSFER_FAILED",
      message: reason,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          wallet: {
            select: { id: true, userId: true, balance: true },
          },
        },
      });
      if (!fresh) throw new Error("Withdrawal missing during finalize.");

      const existingTransaction = await tx.transaction.findUnique({
        where: { reference: `withdrawal-${withdrawalId}` },
        select: { id: true },
      });

      if (!existingTransaction) {
        await createDoubleEntryLedger(tx, {
          fromUserId: fresh.wallet.userId,
          fromWalletId: fresh.wallet.id,
          entryType: "SELLER_PAYOUT",
          amount: fresh.amount,
          reference: `withdrawal-settlement-${withdrawalId}`,
          resolveFromWallet: false,
          resolveToWallet: false,
        });

        await tx.transaction.create({
          data: {
            walletId: fresh.wallet.id,
            userId: fresh.wallet.userId,
            amount: fresh.amount,
            type: "WITHDRAWAL",
            status: "SUCCESS",
            reference: `withdrawal-${withdrawalId}`,
            description: "Seller withdrawal approved and transferred to Stripe.",
          },
        });
      }

      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          method: "STRIPE_CONNECT",
          accountInfo: JSON.stringify({
            provider: "stripe",
            transferId,
            destination: stripeAccountId,
          }),
        },
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to finalize withdrawal.";
    if (message.includes("Insufficient")) {
      await rejectWithdrawal(withdrawalId, message);
      return {
        success: false,
        code: "INSUFFICIENT_BALANCE",
        message,
      };
    }
    return {
      success: false,
      code: "TRANSFER_FAILED",
      message,
    };
  }

  return {
    success: true,
    withdrawalId,
    status: "COMPLETED",
    transferId,
    amount: withdrawal.amount,
  };
}

export async function approveSellerWithdrawalAction(withdrawalId: string) {
  return approveSellerWithdrawalCore(withdrawalId, { skipRoleCheck: false });
}
