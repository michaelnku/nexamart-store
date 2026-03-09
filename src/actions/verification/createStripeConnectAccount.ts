"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function createStripeConnectAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      store: true,
      riderProfile: true,
      staffProfile: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existingAccountId =
    user.store?.stripeAccountId ||
    user.riderProfile?.stripeAccountId ||
    user.staffProfile?.stripeAccountId;

  if (existingAccountId) {
    return existingAccountId;
  }

  const account = await stripe.accounts.create({
    type: "express",
    email: user.email ?? undefined,
    metadata: {
      userId,
    },
  });

  if (user.store) {
    await prisma.store.update({
      where: { userId },
      data: {
        stripeAccountId: account.id,
      },
    });
  }

  if (user.riderProfile) {
    await prisma.riderProfile.update({
      where: { userId },
      data: {
        stripeAccountId: account.id,
      },
    });
  }

  if (user.staffProfile) {
    await prisma.staffProfile.update({
      where: { userId },
      data: {
        stripeAccountId: account.id,
      },
    });
  }

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "CONNECT_CREATED",
  });

  return account.id;
}
