import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { createStripeConnectAccount } from "@/actions/verification/createStripeConnectAccount";

export async function handleVerificationEvent(
  session: Stripe.Identity.VerificationSession,
) {
  const verificationId = session.metadata?.verificationId;
  const role = session.metadata?.role;
  const userId = session.metadata?.userId;

  if (!verificationId || !userId) return;

  let documentType: string | null = null;

  const report = session.last_verification_report;

  if (report && typeof report !== "string") {
    documentType = report.document?.type ?? null;
  }

  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      documentType,
      stripeSessionId: session.id,
    },
  });

  if (role === "SELLER") {
    await prisma.store.update({
      where: { userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        isActive: true,
      },
    });
  }

  if (role === "RIDER") {
    await prisma.riderProfile.update({
      where: { userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  if (role === "STAFF") {
    await prisma.staffProfile.update({
      where: { userId },
      data: {
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
  }

  await createStripeConnectAccount(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationFailedAttempts: 0,
    },
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "VERIFIED",
  });
}

export async function handleVerificationProcessing(
  session: Stripe.Identity.VerificationSession,
) {
  const verificationId = session.metadata?.verificationId;
  const userId = session.metadata?.userId;

  if (!verificationId || !userId) return;

  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: "IN_REVIEW",
    },
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "IN_REVIEW",
  });
}

export async function handleVerificationCancelled(
  session: Stripe.Identity.VerificationSession,
) {
  const verificationId = session.metadata?.verificationId;
  const userId = session.metadata?.userId;

  if (!verificationId || !userId) return;

  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: "CANCELLED",
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      title: "Verification Cancelled",
      message:
        "You exited the identity verification process. You can restart verification anytime.",
      type: "VERIFICATION",
    },
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "CANCELLED",
  });
}

const errorMap: Record<string, string> = {
  document_expired: "Your ID document has expired.",
  document_unreadable:
    "Your ID image is unclear. Please upload a clearer photo.",
  selfie_mismatch: "Your selfie does not match the ID document.",
};

export async function handleVerificationFailure(
  session: Stripe.Identity.VerificationSession,
) {
  const verificationId = session.metadata?.verificationId;
  const userId = session.metadata?.userId;

  if (!verificationId || !userId) return;

  let reason = "Verification requires additional information";

  reason = errorMap[reason] ?? reason;

  const report = session.last_verification_report;

  if (report && typeof report !== "string") {
    reason =
      report.document?.error?.reason ?? report.selfie?.error?.reason ?? reason;
  }

  await prisma.$transaction(async (tx) => {
    await tx.verification.update({
      where: { id: verificationId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });

    await tx.verificationDocument.updateMany({
      where: {
        userId,
        verificationId,
      },
      data: {
        status: "REJECTED",
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: "Verification Failed",
        message:
          "Your identity verification failed. Please upload new documents and retry verification.",
        type: "VERIFICATION",
      },
    });
  });

  await pusherServer.trigger(`user-${userId}`, "verification-updated", {
    status: "REJECTED",
  });
}
