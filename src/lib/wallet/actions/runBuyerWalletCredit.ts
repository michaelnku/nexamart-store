import type { WalletStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { TREASURY_LEDGER_ROUTING } from "@/lib/ledger/treasurySubledgers";

export async function runBuyerWalletCredit(
  userId: string,
  amount: number,
  description?: string,
  reference?: string,
) {
  if (amount <= 0) throw new Error("Amount must be greater than zero");

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

    const systemEscrowAccount = await getOrCreateSystemEscrowAccount(tx);

    await createDoubleEntryLedger(tx, {
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: userId,
      toWalletId: wallet.id,
      entryType: "BUYER_CREDIT",
      amount,
      reference: reference ?? `buyer-credit-${userId}-${Date.now()}`,
      ...TREASURY_LEDGER_ROUTING.buyerWalletCredit,
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

  if (!wallet) {
    throw new Error("Failed to persist buyer wallet credit");
  }

  return wallet;
}

