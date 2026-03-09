"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CurrentUserId } from "@/lib/currentUser";
import { VerificationRole } from "@/generated/prisma";
import { pusherServer } from "@/lib/pusher";

export async function startVerification(role: VerificationRole) {
  const userId = await CurrentUserId();

  if (!userId) {
    return { error: "Unauthorized" };
  }

  const verification = await prisma.verification.create({
    data: {
      userId,
      role,
      status: "PENDING",
    },
  });

  await prisma.verificationDocument.updateMany({
    where: {
      userId,
      verificationId: null,
    },
    data: {
      verificationId: verification.id,
    },
  });

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: {
      verificationId: verification.id,
      userId,
      role,
    },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/verification/success/${verification.id}`,
  });

  await prisma.verification.update({
    where: { id: verification.id },
    data: {
      stripeVerificationId: session.id,
      stripeSessionId: session.id,
    },
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {});

  return { url: session.url };
}
