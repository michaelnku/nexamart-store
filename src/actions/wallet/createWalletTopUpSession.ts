"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { stripe } from "@/lib/stripe";

const MAX_TOP_UP_USD = 5000;

export async function createWalletTopUpSession(amount: number) {
  const userId = await CurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  if (amount > MAX_TOP_UP_USD) {
    throw new Error(`Amount exceeds limit of ${MAX_TOP_UP_USD} USD`);
  }

  const unitAmount = Math.round(amount * 100);
  if (unitAmount <= 0) {
    throw new Error("Invalid amount");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: {
            name: "NexaMart Wallet Top-Up",
          },
        },
      },
    ],
    metadata: {
      type: "WALLET_TOPUP",
      userId,
    },
    success_url: `${appUrl}/wallet/topup/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/wallet/topup/cancel`,
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return { url: session.url };
}
