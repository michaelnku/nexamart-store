import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type StripeCustomerUser = {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
};

type GetOrCreateStripeCustomerOptions = {
  tx?: Prisma.TransactionClient;
  user?: StripeCustomerUser;
};

export async function getOrCreateStripeCustomerForUser(
  userId: string,
  options: GetOrCreateStripeCustomerOptions = {},
) {
  const db = options.tx ?? prisma;

  const user =
    options.user ??
    (await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    }));

  if (!user) {
    throw new Error("User not found");
  }

  if (user.stripeCustomerId) {
    return {
      stripeCustomerId: user.stripeCustomerId,
      created: false,
    };
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId: user.id,
    },
  });

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customer.id,
    },
    select: {
      stripeCustomerId: true,
    },
  });

  return {
    stripeCustomerId: updatedUser.stripeCustomerId!,
    created: true,
  };
}
