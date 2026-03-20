import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  handleLegacyOrderCheckout,
  handleOrderCheckout,
} from "./checkout";
import {
  handleVerificationCancelled,
  handleVerificationEvent,
  handleVerificationFailure,
  handleVerificationProcessing,
} from "./verification";
import { handleWalletTopUp } from "./walletTopUp";

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
