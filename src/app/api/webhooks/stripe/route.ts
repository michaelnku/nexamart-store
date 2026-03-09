import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { DeliveryType } from "@/generated/prisma/client";
import { placeOrderAction } from "@/actions/checkout/placeOrder";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { applyReferralRewardsForPaidOrder } from "@/lib/referrals/applyReferralRewards";
import { stripe } from "@/lib/stripe";
import { completeOrderPayment } from "@/lib/payments/completeOrderPayment";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { createServiceContext } from "@/lib/system/serviceContext";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";

function isDeliveryType(value: string): value is DeliveryType {
  return (
    value === "HOME_DELIVERY" ||
    value === "EXPRESS_DELIVERY" ||
    value === "STORE_PICKUP" ||
    value === "STATION_PICKUP"
  );
}

async function handleWalletTopUp(session: Stripe.Checkout.Session) {
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

      const platformClearingAccount = await getOrCreateSystemEscrowAccount();

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

async function settleCreatedOrders({
  orderId,
  checkoutGroupId,
  paymentIntentId,
}: {
  orderId: string;
  checkoutGroupId?: string | null;
  paymentIntentId: string;
}) {
  const context = createServiceContext("ORDER_PAYMENT_WEBHOOK");

  const targetOrders = checkoutGroupId
    ? await prisma.order.findMany({
        where: { checkoutGroupId },
        select: { id: true },
      })
    : [{ id: orderId }];

  for (const target of targetOrders) {
    try {
      const paymentResult = await completeOrderPayment({
        orderId: target.id,
        paymentReference: `order-payment-${paymentIntentId}-${target.id}`,
        method: "CARD",
        context,
      });

      if (!paymentResult.justPaid) {
        continue;
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

      await pusherServer.trigger(
        `user-${paidOrder.userId}`,
        "payment-success",
        {
          orderId: target.id,
          message: "Payment received! Your order is now processing.",
        },
      );

      for (const group of paidOrder.sellerGroups) {
        await pusherServer.trigger(`seller-${group.sellerId}`, "new-order", {
          orderId: target.id,
          storeId: group.storeId,
          subtotal: group.subtotal,
        });
      }

      await applyReferralRewardsForPaidOrder(target.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("already marked as paid")) {
        continue;
      }
      throw error;
    }
  }
}

async function handleLegacyOrderCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  const checkoutGroupId = session.metadata?.checkoutGroupId || null;
  const paymentIntentRaw = session.payment_intent;

  const paymentIntentId =
    typeof paymentIntentRaw === "string"
      ? paymentIntentRaw
      : (paymentIntentRaw?.id ?? null);

  if (!orderId || !paymentIntentId) {
    return new NextResponse("Invalid checkout metadata", { status: 400 });
  }

  await settleCreatedOrders({ orderId, checkoutGroupId, paymentIntentId });
  return new NextResponse(null, { status: 200 });
}

async function handleOrderCheckout(session: Stripe.Checkout.Session) {
  const paymentIntentRaw = session.payment_intent;

  const paymentIntentId =
    typeof paymentIntentRaw === "string"
      ? paymentIntentRaw
      : (paymentIntentRaw?.id ?? null);

  const addressId = session.metadata?.addressId;
  const deliveryTypeRaw = session.metadata?.deliveryType;
  const couponIdRaw = session.metadata?.couponId;
  const idempotencyKey = session.metadata?.idempotencyKey;
  const userId = session.metadata?.userId;

  if (
    !paymentIntentId ||
    !addressId ||
    !deliveryTypeRaw ||
    !idempotencyKey ||
    !userId
  ) {
    return new NextResponse("Invalid checkout metadata", { status: 400 });
  }

  if (!isDeliveryType(deliveryTypeRaw)) {
    return new NextResponse("Invalid delivery type", { status: 400 });
  }

  const placeOrder = await placeOrderAction({
    addressId,
    paymentMethod: "CARD",
    deliveryType: deliveryTypeRaw,
    couponId: couponIdRaw ? couponIdRaw : null,
    idempotencyKey,
    __internalUserId: userId,
    __internalAuthToken: process.env.STRIPE_WEBHOOK_SECRET,
  });

  if ("error" in placeOrder) {
    console.error("Failed to create order from webhook:", placeOrder.error);
    return new NextResponse(placeOrder.error, { status: 400 });
  }

  if (!placeOrder.orderId) {
    return new NextResponse("Order not created from webhook checkout", {
      status: 400,
    });
  }

  await settleCreatedOrders({
    orderId: placeOrder.orderId,
    checkoutGroupId: placeOrder.checkoutGroupId,
    paymentIntentId,
  });

  return new NextResponse(null, { status: 200 });
}

/* ===============================
   VERIFICATION HANDLERS
================================ */

async function handleVerificationEvent(
  session: Stripe.Identity.VerificationSession,
) {
  const verificationId = session.metadata?.verificationId;
  const role = session.metadata?.role;
  const userId = session.metadata?.userId;

  if (!verificationId || !userId) return;

  let documentType: string | null = null;

  const report = session.last_verification_report;

  if (report && typeof report !== "string") {
    documentType = report.document?.type ?? null;
  }

  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      documentType,
      stripeSessionId: session.id,
    },
  });

  if (role === "SELLER") {
    await prisma.store.update({
      where: { userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        isActive: true,
      },
    });
  }

  if (role === "RIDER") {
    await prisma.riderProfile.update({
      where: { userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  if (role === "STAFF") {
    await prisma.staffProfile.update({
      where: { userId },
      data: {
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationFailedAttempts: 0,
    },
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "VERIFIED",
  });
}

async function handleVerificationProcessing(
  session: Stripe.Identity.VerificationSession,
) {
  const verificationId = session.metadata?.verificationId;
  const userId = session.metadata?.userId;

  if (!verificationId || !userId) return;

  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: "IN_REVIEW",
    },
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "IN_REVIEW",
  });
}

async function handleVerificationCancelled(
  session: Stripe.Identity.VerificationSession,
) {
  const verificationId = session.metadata?.verificationId;
  const userId = session.metadata?.userId;

  if (!verificationId || !userId) return;

  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: "CANCELLED",
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      title: "Verification Cancelled",
      message:
        "You exited the identity verification process. You can restart verification anytime.",
      type: "VERIFICATION",
    },
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "CANCELLED",
  });
}

const errorMap: Record<string, string> = {
  document_expired: "Your ID document has expired.",
  document_unreadable:
    "Your ID image is unclear. Please upload a clearer photo.",
  selfie_mismatch: "Your selfie does not match the ID document.",
};

async function handleVerificationFailure(
  session: Stripe.Identity.VerificationSession,
) {
  const verificationId = session.metadata?.verificationId;
  const userId = session.metadata?.userId;

  if (!verificationId || !userId) return;

  let reason = "Verification requires additional information";

  reason = errorMap[reason] ?? reason;

  const report = session.last_verification_report;

  if (report && typeof report !== "string") {
    reason =
      report.document?.error?.reason ?? report.selfie?.error?.reason ?? reason;
  }

  await prisma.$transaction(async (tx) => {
    // mark verification rejected
    await tx.verification.update({
      where: { id: verificationId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });

    // unlock documents so user can upload again
    await tx.verificationDocument.updateMany({
      where: {
        userId,
        verificationId,
      },
      data: {
        status: "REJECTED",
      },
    });

    // notify user
    await tx.notification.create({
      data: {
        userId,
        title: "Verification Failed",
        message:
          "Your identity verification failed. Please upload new documents and retry verification.",
        type: "VERIFICATION",
      },
    });
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "REJECTED",
  });
}

/* ===============================
   MAIN WEBHOOK
================================ */

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

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
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";
    console.error("Webhook signature verification failed:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  /* ===============================
   VERIFICATION EVENTS
================================ */

  console.log("Stripe webhook received:", event.type);

  if (event.type === "identity.verification_session.processing") {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    await handleVerificationProcessing(session);
    return NextResponse.json({ received: true });
  }

  if (event.type === "identity.verification_session.verified") {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    await handleVerificationEvent(session);
    return NextResponse.json({ received: true });
  }

  if (event.type === "identity.verification_session.requires_input") {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    await handleVerificationFailure(session);
    return NextResponse.json({ received: true });
  }

  if (event.type === "identity.verification_session.canceled") {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    await handleVerificationCancelled(session);
    return NextResponse.json({ received: true });
  }

  /* ===============================
     CHECKOUT EVENTS
  =============================== */

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return new NextResponse(null, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.type === "WALLET_TOPUP") {
    return handleWalletTopUp(session);
  }

  if (session.metadata?.orderId) {
    return handleLegacyOrderCheckout(session);
  }

  return handleOrderCheckout(session);
}
