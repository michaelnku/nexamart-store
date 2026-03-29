import type { WalletStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { TREASURY_LEDGER_ROUTING } from "@/lib/ledger/treasurySubledgers";

export async function runBuyerWalletDebit(
  userId: string,
  amount: number,
  description?: string,
  reference?: string,
) {
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const existingWallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existingWallet) {
    const availableBalance = await calculateWalletBalance(existingWallet.id);
    if (availableBalance < amount) {
      throw new Error("Insufficient wallet balance");
    }
  }

  let wallet:
    | {
        id: string;
        userId: string;
        balance: number;
        totalEarnings: number;
        pending: number;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
        status: WalletStatus;
      }
    | undefined;

  await prisma.$transaction(async (tx) => {
    wallet = await tx.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const availableBalance = await calculateWalletBalance(wallet.id, tx);
    if (availableBalance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const systemEscrowAccount = await getOrCreateSystemEscrowAccount(tx);

    await createDoubleEntryLedger(tx, {
      fromUserId: userId,
      fromWalletId: wallet.id,
      toWalletId: systemEscrowAccount.walletId,
      entryType: "ESCROW_DEPOSIT",
      amount,
      reference: reference ?? `buyer-debit-${userId}-${Date.now()}`,
      ...TREASURY_LEDGER_ROUTING.orderEscrowFunding,
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

  if (!wallet) {
    throw new Error("Failed to persist buyer wallet debit");
  }

  return wallet;
}

