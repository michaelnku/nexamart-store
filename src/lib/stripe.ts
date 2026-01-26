import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_WEBHOOK_SECRET!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});
