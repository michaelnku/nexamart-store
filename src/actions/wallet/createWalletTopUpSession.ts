"use server";

import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/config/appUrl";
import { getOrCreateStripeCustomerForUser } from "@/lib/stripe/getOrCreateStripeCustomer";

const MIN_TOP_UP_USD = 1;
const MAX_TOP_UP_USD = 10000;

export async function createWalletTopUpSession(
  amount: number,
): Promise<string> {
  const userId = await CurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      email: true,
      name: true,
      stripeCustomerId: true,
      isBanned: true,
      isDeleted: true,
      deletedAt: true,
      wallet: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "USER") {
    throw new Error("Only users can fund wallet");
  }

  if (user.isBanned || user.isDeleted || user.deletedAt) {
    throw new Error("This account cannot fund a wallet right now.");
  }

  if (!user.wallet || user.wallet.status !== "ACTIVE") {
    throw new Error("Activate your wallet before funding it.");
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

  const stripeCustomer = await getOrCreateStripeCustomerForUser(user.id, {
    user,
  });

  const unitAmount = normalizedAmount * 100;
  if (unitAmount <= 0) {
    throw new Error("Invalid amount");
  }

  const baseUrl = getAppBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomer.stripeCustomerId,
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
