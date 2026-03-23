"use server";

import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { resendEmailVerificationForUser } from "@/lib/email-verification/service";

export type ResendEmailVerificationActionResult =
  | {
      success: true;
      code: "EMAIL_VERIFICATION_SENT" | "EMAIL_ALREADY_VERIFIED";
      message: string;
      cooldownEndsAt?: string;
    }
  | {
      success: false;
      code:
        | "UNAUTHORIZED"
        | "EMAIL_VERIFICATION_COOLDOWN"
        | "EMAIL_VERIFICATION_SEND_FAILED";
      message: string;
      retryAfterSeconds?: number;
      cooldownEndsAt?: string;
    };

type ResendEmailVerificationOptions = {
  email?: string;
};

export async function resendEmailVerificationForCurrentUser(
  options?: ResendEmailVerificationOptions,
): Promise<ResendEmailVerificationActionResult> {
  const currentUser = await CurrentUser();
  const normalizedEmail = options?.email?.toLowerCase().trim();

  const user = currentUser?.id
    ? await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
        },
      })
    : normalizedEmail
      ? await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
          },
        })
      : null;

  if (!user) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unable to resend verification right now.",
    };
  }

  let result: Awaited<ReturnType<typeof resendEmailVerificationForUser>>;

  try {
    result = await resendEmailVerificationForUser(user);
  } catch (error) {
    console.error(
      "Failed to resend verification email for user",
      user.id,
      error,
    );
    return {
      success: false,
      code: "EMAIL_VERIFICATION_SEND_FAILED",
      message: "Unable to send a verification email right now. Please try again shortly.",
    };
  }

  if (result.status === "already_verified") {
    return {
      success: true,
      code: "EMAIL_ALREADY_VERIFIED",
      message: "Your email is already verified.",
    };
  }

  if (result.status === "cooldown") {
    return {
      success: false,
      code: "EMAIL_VERIFICATION_COOLDOWN",
      message: `Please wait ${result.retryAfterSeconds} seconds before requesting another verification email.`,
      retryAfterSeconds: result.retryAfterSeconds,
      cooldownEndsAt: result.cooldownEndsAt.toISOString(),
    };
  }

  return {
    success: true,
    code: "EMAIL_VERIFICATION_SENT",
    message: "Verification email sent. Check your inbox.",
    cooldownEndsAt: result.cooldownEndsAt.toISOString(),
  };
}

export async function getEmailVerificationStatus(options?: {
  email?: string;
}): Promise<{ verified: boolean }> {
  const currentUser = await CurrentUser();
  const normalizedEmail = options?.email?.toLowerCase().trim();

  if (currentUser?.id) {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { emailVerified: true },
    });

    return { verified: Boolean(user?.emailVerified) };
  }

  if (!normalizedEmail) {
    return { verified: false };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { emailVerified: true },
  });

  return { verified: Boolean(user?.emailVerified) };
}
