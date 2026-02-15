import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_WEBHOOK_SECRET ?? "", {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});
