import type Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { applyReferralRewardsForPaidOrder } from "@/lib/referrals/applyReferralRewards";
import { stripe } from "@/lib/stripe";
import { completeOrderPayment } from "@/lib/payments/completeOrderPayment";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

async function handleWalletTopUp(session: Stripe.Checkout.Session) {
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

  try {
    await prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findUnique({
        where: { reference: paymentIntentId },
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

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "DEPOSIT",
          status: "SUCCESS",
          amount,
          reference: paymentIntentId,
          description: "Stripe wallet top-up",
        },
      });

      await createDoubleEntryLedger(tx, {
        toUserId: userId,
        toWalletId: wallet.id,
        entryType: "ESCROW_DEPOSIT",
        amount,
        reference: `wallet-topup-${paymentIntentId}`,
        resolveFromWallet: false,
        resolveToWallet: false,
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

async function handleOrderCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  const paymentIntentRaw = session.payment_intent;
  const paymentIntentId =
    typeof paymentIntentRaw === "string"
      ? paymentIntentRaw
      : (paymentIntentRaw?.id ?? null);

  if (!orderId || !paymentIntentId) {
    console.error("Missing orderId or payment_intent in Stripe metadata");
    return new NextResponse("Invalid checkout metadata", { status: 400 });
  }

  const paymentResult = await completeOrderPayment({
    orderId,
    paymentReference: paymentIntentId,
    method: "CARD",
  });

  if (!paymentResult.justPaid) {
    return new NextResponse(null, { status: 200 });
  }

  const paidOrder = paymentResult.order;

  await prisma.product.updateMany({
    where: {
      id: {
        in: await prisma.orderItem
          .findMany({
            where: { orderId: paidOrder.id },
            select: { productId: true },
          })
          .then((items) => items.map((item) => item.productId)),
      },
    },
    data: { isPublished: true },
  });

  await pusherServer.trigger(`user-${paidOrder.userId}`, "payment-success", {
    orderId,
    message: "Payment received! Your order is now processing.",
  });

  for (const group of paidOrder.sellerGroups) {
    await pusherServer.trigger(`seller-${group.sellerId}`, "new-order", {
      orderId,
      storeId: group.storeId,
      subtotal: group.subtotal,
    });
  }

  await applyReferralRewardsForPaidOrder(orderId);

  return new NextResponse(null, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";
    console.error("Webhook signature verification failed:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new NextResponse(null, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.type === "WALLET_TOPUP") {
    return handleWalletTopUp(session);
  }

  return handleOrderCheckout(session);
}
