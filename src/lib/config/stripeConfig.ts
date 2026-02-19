import "server-only";

export function validateStripeEnv() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  if (!process.env.STRIPE_PUBLIC_KEY) {
    throw new Error("Missing STRIPE_PUBLIC_KEY");
  }
}
