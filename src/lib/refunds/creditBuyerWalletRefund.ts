import { Prisma } from "@/generated/prisma";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";

type Tx = Prisma.TransactionClient;

type CreditBuyerWalletRefundInput = {
  orderId: string;
  buyerUserId: string;
  amount: number;
  reference: string;
  description: string;
  transactionReference?: string;
};

function normalizePositiveAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  return Number(amount.toFixed(2));
}

export async function creditBuyerWalletRefundInTx(
  tx: Tx,
  input: CreditBuyerWalletRefundInput,
) {
  const amount = normalizePositiveAmount(input.amount);
  const systemEscrowAccount = await getOrCreateSystemEscrowAccount(tx);

  const buyerWallet = await tx.wallet.upsert({
    where: { userId: input.buyerUserId },
    update: {},
    create: {
      userId: input.buyerUserId,
      currency: "USD",
    },
    select: { id: true },
  });

  await createEscrowEntryIdempotent(tx, {
    orderId: input.orderId,
    userId: input.buyerUserId,
    role: "BUYER",
    entryType: "REFUND",
    amount,
    status: "RELEASED",
    reference: input.reference,
  });

  await createDoubleEntryLedger(tx, {
    orderId: input.orderId,
    fromWalletId: systemEscrowAccount.walletId,
    toUserId: input.buyerUserId,
    toWalletId: buyerWallet.id,
    entryType: "REFUND",
    amount,
    reference: `${input.reference}-ledger`,
    fromAccountType: "PLATFORM",
    toAccountType: "PLATFORM",
    debitBalanceAccountType: "PLATFORM",
    allowNegativeFromWallet: true,
  });

  const transactionReference = input.transactionReference ?? `${input.reference}-tx`;

  const refundTransaction = await tx.transaction.upsert({
    where: { reference: transactionReference },
    update: {
      amount,
      status: "SUCCESS",
      description: input.description,
    },
    create: {
      walletId: buyerWallet.id,
      userId: input.buyerUserId,
      orderId: input.orderId,
      type: "REFUND",
      amount,
      status: "SUCCESS",
      reference: transactionReference,
      description: input.description,
    },
  });

  return {
    refundTransaction,
    walletId: buyerWallet.id,
    amount,
  };
}
