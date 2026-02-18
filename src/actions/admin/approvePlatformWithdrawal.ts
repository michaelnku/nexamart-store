"use server";

import { CurrentRole } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Prisma } from "@/generated/prisma";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

type ApprovePlatformWithdrawalResult =
  | {
      success: true;
      withdrawalId: string;
      status: "COMPLETED";
      payoutId: string;
      amount: number;
    }
  | {
      success: false;
      code:
        | "UNAUTHORIZED"
        | "NOT_FOUND"
        | "INVALID_STATUS"
        | "INSUFFICIENT_BALANCE"
        | "INSUFFICIENT_COMMISSION"
        | "PAYOUT_FAILED";
      message: string;
    };

async function markRejected(withdrawalId: string, reason: string) {
  await prisma.withdrawal.updateMany({
    where: { id: withdrawalId, status: { in: ["PENDING", "PROCESSING"] } },
    data: {
      status: "REJECTED",
      processedAt: new Date(),
      accountInfo: reason,
    },
  });
}

async function allocateCommissionRows(
  tx: Prisma.TransactionClient,
  amount: number,
  withdrawalId: string,
) {
  let remaining = amount;

  const rows = await tx.escrowLedger.findMany({
    where: {
      role: "PLATFORM",
      entryType: "PLATFORM_COMMISSION",
      status: { in: ["RELEASED", "WITHDRAWN"] },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      amount: true,
      withdrawnAmount: true,
      status: true,
    },
  });

  for (const row of rows) {
    if (remaining <= 0) break;
    const available = Math.max(0, row.amount - row.withdrawnAmount);
    if (available <= 0) continue;

    const take = Math.min(available, remaining);
    const nextWithdrawn = row.withdrawnAmount + take;

    await tx.escrowLedger.update({
      where: { id: row.id },
      data: {
        withdrawnAmount: nextWithdrawn,
        status: nextWithdrawn >= row.amount ? "WITHDRAWN" : "RELEASED",
        metadata: {
          withdrawalId,
        },
      },
    });

    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error("Insufficient released platform commission to allocate.");
  }
}

export async function approvePlatformWithdrawalAction(
  withdrawalId: string,
): Promise<ApprovePlatformWithdrawalResult> {
  const role = await CurrentRole();
  if (role !== "ADMIN" && role !== "SYSTEM") {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Only ADMIN or SYSTEM can approve platform withdrawals.",
    };
  }

  const withdrawal = await prisma.withdrawal.findUnique({
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

  if (!withdrawal) {
    return {
      success: false,
      code: "NOT_FOUND",
      message: "Withdrawal not found.",
    };
  }

  if (withdrawal.status === "COMPLETED") {
    const payoutId = (() => {
      try {
        const parsed = JSON.parse(withdrawal.accountInfo ?? "{}") as {
          payoutId?: string;
        };
        return parsed.payoutId ?? "";
      } catch {
        return "";
      }
    })();

    return {
      success: true,
      withdrawalId,
      status: "COMPLETED",
      payoutId,
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

  if (withdrawal.status === "PENDING") {
    await prisma.withdrawal.updateMany({
      where: { id: withdrawalId, status: "PENDING" },
      data: { status: "PROCESSING" },
    });
  }

  const cents = Math.round(withdrawal.amount * 100);

  let payoutId: string;
  try {
    const payout = await stripe.payouts.create(
      {
        amount: cents,
        currency: "usd",
        metadata: {
          type: "PLATFORM_WITHDRAWAL",
          withdrawalId,
        },
      },
      {
        idempotencyKey: `platform-withdrawal-${withdrawalId}`,
      },
    );
    payoutId = payout.id;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Stripe payout failed.";
    await markRejected(withdrawalId, reason);
    return {
      success: false,
      code: "PAYOUT_FAILED",
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
      if (!fresh) throw new Error("Withdrawal missing during finalize.");

      const existingTx = await tx.transaction.findUnique({
        where: { reference: `platform-withdrawal-${withdrawalId}` },
        select: { id: true },
      });

      if (!existingTx) {
        await createDoubleEntryLedger(tx, {
          fromUserId: fresh.wallet.userId,
          fromWalletId: fresh.wallet.id,
          entryType: "PLATFORM_FEE",
          amount: fresh.amount,
          reference: `platform-withdrawal-settlement-${withdrawalId}`,
          resolveFromWallet: false,
          resolveToWallet: false,
        });

        await allocateCommissionRows(tx, fresh.amount, withdrawalId);

        await tx.transaction.create({
          data: {
            walletId: fresh.wallet.id,
            userId: fresh.wallet.userId,
            amount: fresh.amount,
            type: "WITHDRAWAL",
            status: "SUCCESS",
            reference: `platform-withdrawal-${withdrawalId}`,
            description: "Platform treasury withdrawal payout.",
          },
        });
      }

      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          method: "STRIPE_TREASURY",
          accountInfo: JSON.stringify({
            provider: "stripe",
            payoutId,
          }),
        },
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to finalize payout.";
    if (message.includes("commission")) {
      await markRejected(withdrawalId, message);
      return {
        success: false,
        code: "INSUFFICIENT_COMMISSION",
        message,
      };
    }
    if (message.includes("balance")) {
      await markRejected(withdrawalId, message);
      return {
        success: false,
        code: "INSUFFICIENT_BALANCE",
        message,
      };
    }
    return {
      success: false,
      code: "PAYOUT_FAILED",
      message,
    };
  }

  return {
    success: true,
    withdrawalId,
    status: "COMPLETED",
    payoutId,
    amount: withdrawal.amount,
  };
}
