"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { VerificationRole } from "@/generated/prisma";

export async function startVerification(role: VerificationRole) {
  const userId = await CurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const verification = await prisma.verification.create({
    data: {
      userId,
      role,
      status: "PENDING",
    },
  });

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: {
      userId,
      verificationId: verification.id,
      role,
    },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/verification/success`,
  });

  await prisma.verification.update({
    where: { id: verification.id },
    data: {
      stripeVerificationId: session.id,
    },
  });

  return { url: session.url };
}
