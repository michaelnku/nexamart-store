"use server";

import { CurrentRole } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

type ApproveOptions = {
  skipRoleCheck?: boolean;
};

type ApproveRiderWithdrawalResult =
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

async function hasAdminAccess(skipRoleCheck = false) {
  if (skipRoleCheck) return true;
  const role = await CurrentRole();
  return role === "ADMIN";
}

async function markRejected(withdrawalId: string, reason: string) {
  await prisma.withdrawal.updateMany({
    where: {
      id: withdrawalId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
    data: {
      status: "REJECTED",
      processedAt: new Date(),
      accountInfo: reason,
    },
  });
}

export async function approveRiderWithdrawalCore(
  withdrawalId: string,
  options: ApproveOptions = {},
): Promise<ApproveRiderWithdrawalResult> {
  const allowed = await hasAdminAccess(options.skipRoleCheck);
  if (!allowed) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Only admins can approve rider withdrawals.",
    };
  }

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: {
      wallet: {
        include: {
          user: {
            include: {
              riderProfile: {
                select: { stripeAccountId: true },
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
      withdrawalId,
      status: "COMPLETED",
      transferId,
      amount: withdrawal.amount,
    };
  }

  if (!["PENDING", "PROCESSING"].includes(withdrawal.status)) {
    return {
      success: false,
      code: "INVALID_STATUS",
      message: "Withdrawal cannot be approved from current status.",
    };
  }

  const stripeAccountId = withdrawal.wallet.user.riderProfile?.stripeAccountId;
  if (!stripeAccountId) {
    return {
      success: false,
      code: "MISSING_STRIPE_ACCOUNT",
      message: "Rider Stripe account is missing.",
    };
  }

  if (withdrawal.status === "PENDING") {
    await prisma.withdrawal.updateMany({
      where: { id: withdrawalId, status: "PENDING" },
      data: { status: "PROCESSING" },
    });
  }

  const cents = Math.round(withdrawal.amount * 100);

  let transferId: string;
  try {
    const transfer = await stripe.transfers.create(
      {
        amount: cents,
        currency: "usd",
        destination: stripeAccountId,
        metadata: {
          type: "RIDER_WITHDRAWAL",
          withdrawalId,
        },
      },
      {
        idempotencyKey: `rider-withdrawal-${withdrawalId}`,
      },
    );
    transferId = transfer.id;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Stripe rider transfer failed.";
    await markRejected(withdrawalId, reason);
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
            select: {
              id: true,
              userId: true,
              balance: true,
            },
          },
        },
      });
      if (!fresh) throw new Error("Withdrawal not found during finalization.");

      const existing = await tx.transaction.findUnique({
        where: { reference: `rider-withdrawal-${withdrawalId}` },
        select: { id: true },
      });

      if (!existing) {
        await createDoubleEntryLedger(tx, {
          fromUserId: fresh.wallet.userId,
          fromWalletId: fresh.wallet.id,
          entryType: "RIDER_PAYOUT",
          amount: fresh.amount,
          reference: `rider-withdrawal-settlement-${withdrawalId}`,
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
            reference: `rider-withdrawal-${withdrawalId}`,
            description: "Rider withdrawal sent to Stripe Connect account.",
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
      error instanceof Error ? error.message : "Failed to finalize rider payout.";
    if (message.includes("Insufficient")) {
      await markRejected(withdrawalId, message);
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

export async function approveRiderWithdrawalAction(withdrawalId: string) {
  return approveRiderWithdrawalCore(withdrawalId, { skipRoleCheck: false });
}
