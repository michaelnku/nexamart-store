"use server";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { stripe } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/config/appUrl";

const MIN_TOP_UP_USD = 1;
const MAX_TOP_UP_USD = 10000;

export async function createWalletTopUpSession(
  amount: number,
): Promise<string> {
  const [userId, role] = await Promise.all([CurrentUserId(), CurrentRole()]);

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (role !== "USER") {
    throw new Error("Only users can fund wallet");
  }

  if (!Number.isFinite(amount)) {
    throw new Error("Amount must be a valid number");
  }

  const normalizedAmount = Math.floor(amount);
  if (normalizedAmount < MIN_TOP_UP_USD) {
    throw new Error(`Minimum top-up is $${MIN_TOP_UP_USD}`);
  }

  if (normalizedAmount > MAX_TOP_UP_USD) {
    throw new Error(`Amount exceeds limit of ${MAX_TOP_UP_USD} USD`);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is not configured");
  }

  const unitAmount = normalizedAmount * 100;
  if (unitAmount <= 0) {
    throw new Error("Invalid amount");
  }

  const baseUrl = getAppBaseUrl();

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
    success_url: `${baseUrl}/customer/wallet?topup=success`,
    cancel_url: `${baseUrl}/customer/wallet?topup=cancel`,
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return session.url;
}
