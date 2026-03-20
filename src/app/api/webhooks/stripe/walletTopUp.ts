import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { createServiceContext } from "@/lib/system/serviceContext";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";

export async function handleWalletTopUp(session: Stripe.Checkout.Session) {
  const context = createServiceContext("WALLET_TOPUP_WEBHOOK");
  const userId = session.metadata?.userId;
  const amountTotal = session.amount_total;
  const paymentIntentRaw = session.payment_intent;
  const paymentIntentId =
    typeof paymentIntentRaw === "string"
      ? paymentIntentRaw
      : (paymentIntentRaw?.id ?? null);

  if (!userId || !paymentIntentId || typeof amountTotal !== "number") {
    console.error("Invalid wallet top-up webhook payload", {
      userId,
      paymentIntentId,
      amountTotal,
    });
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }

  const amount = amountTotal / 100;
  const topupReference = `wallet-topup-${paymentIntentId}`;

  try {
    await prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findUnique({
        where: { reference: topupReference },
        select: { id: true },
      });
      if (existingTx) return;

      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          currency: "USD",
        },
        select: { id: true },
      });

      const platformClearingAccount = await getOrCreateSystemEscrowAccount(tx);

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "DEPOSIT",
          status: "SUCCESS",
          amount,
          reference: topupReference,
          description: "Wallet top-up",
        },
      });

      await createDoubleEntryLedger(tx, {
        fromUserId: platformClearingAccount.userId,
        fromWalletId: platformClearingAccount.walletId,
        toWalletId: wallet.id,
        toUserId: userId,
        entryType: "WALLET_TOPUP",
        amount,
        reference: topupReference,
        resolveToWallet: false,
        allowNegativeFromWallet: true,
        context,
      });
    });
  } catch (error) {
    console.error("Failed to process wallet top-up webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
