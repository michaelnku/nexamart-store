import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend/mail";
import { getAppBaseUrl } from "@/lib/config/appUrl";
import {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_TTL_MS,
} from "@/lib/email-verification/constants";
import { EmailVerificationEmailTemplate } from "@/lib/email-verification/emailVerificationEmailTemplate";
import { generateSecureToken, hashToken } from "@/lib/security/tokens";

const EMAIL_VERIFICATION_EXPIRY_MINUTES = Math.floor(
  EMAIL_VERIFICATION_TTL_MS / (1000 * 60),
);

type MinimalUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: Date | null;
};

export type CreateEmailVerificationTokenResult = {
  rawToken: string;
  expiresAt: Date;
};

export type ResendEmailVerificationResult =
  | {
      status: "sent";
      email: string;
      cooldownEndsAt: Date;
    }
  | {
      status: "cooldown";
      email: string;
      retryAfterSeconds: number;
      cooldownEndsAt: Date;
    }
  | {
      status: "already_verified";
      email: string;
    };

export type VerifyEmailVerificationTokenResult =
  | { status: "verified"; email: string }
  | { status: "already_verified"; email: string }
  | { status: "expired" }
  | { status: "consumed" }
  | { status: "invalid" };

export async function invalidateOutstandingEmailVerificationTokens(
  userId: string,
  email: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await tx.emailVerificationToken.updateMany({
    where: {
      userId,
      email,
      consumedAt: null,
      invalidatedAt: null,
    },
    data: {
      invalidatedAt: new Date(),
    },
  });
}

export async function createEmailVerificationToken(
  userId: string,
  email: string,
): Promise<CreateEmailVerificationTokenResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await invalidateOutstandingEmailVerificationTokens(userId, normalizedEmail, tx);

    await tx.emailVerificationToken.create({
      data: {
        userId,
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      },
    });
  });

  return { rawToken, expiresAt };
}

function buildEmailVerificationUrl(rawToken: string) {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
}

function renderEmailVerificationHtml(verifyUrl: string) {
  return EmailVerificationEmailTemplate({
    verifyUrl,
    expiresInMinutes: EMAIL_VERIFICATION_EXPIRY_MINUTES,
  });
}

export async function sendEmailVerificationEmail(user: MinimalUser) {
  const normalizedEmail = user.email.toLowerCase().trim();
  const { rawToken } = await createEmailVerificationToken(user.id, normalizedEmail);
  const verifyUrl = buildEmailVerificationUrl(rawToken);

  await sendEmail({
    to: normalizedEmail,
    from: `NexaMart <${process.env.EMAIL_FROM_NO_REPLY ?? process.env.EMAIL_FROM}>`,
    replyTo: `NexaMart Support <${process.env.EMAIL_FROM_SUPPORT ?? process.env.EMAIL_FROM}>`,
    subject: "Verify your NexaMart email",
    html: renderEmailVerificationHtml(verifyUrl),
  });

  return {
    email: normalizedEmail,
    verifyUrl,
  };
}

function getCooldownRetrySeconds(createdAt: Date) {
  const retryMs =
    EMAIL_VERIFICATION_RESEND_COOLDOWN_MS - (Date.now() - createdAt.getTime());
  return Math.max(1, Math.ceil(retryMs / 1000));
}

export async function resendEmailVerificationForUser(
  user: MinimalUser,
): Promise<ResendEmailVerificationResult> {
  const normalizedEmail = user.email.toLowerCase().trim();

  if (user.emailVerified) {
    return {
      status: "already_verified",
      email: normalizedEmail,
    };
  }

  const latestToken = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      email: normalizedEmail,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
    },
  });

  if (
    latestToken &&
    Date.now() - latestToken.createdAt.getTime() <
      EMAIL_VERIFICATION_RESEND_COOLDOWN_MS
  ) {
    const retryAfterSeconds = getCooldownRetrySeconds(latestToken.createdAt);
    return {
      status: "cooldown",
      email: normalizedEmail,
      retryAfterSeconds,
      cooldownEndsAt: new Date(
        latestToken.createdAt.getTime() + EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
      ),
    };
  }

  await sendEmailVerificationEmail(user);

  return {
    status: "sent",
    email: normalizedEmail,
    cooldownEndsAt: new Date(Date.now() + EMAIL_VERIFICATION_RESEND_COOLDOWN_MS),
  };
}

export async function verifyEmailVerificationToken(
  rawToken: string,
): Promise<VerifyEmailVerificationTokenResult> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!record || record.invalidatedAt) {
    return { status: "invalid" };
  }

  if (record.user.emailVerified) {
    return {
      status: "already_verified",
      email: record.user.email,
    };
  }

  if (record.consumedAt) {
    return { status: "consumed" };
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: {
        invalidatedAt: record.invalidatedAt ?? new Date(),
      },
    });

    return { status: "expired" };
  }

  const verifiedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const freshRecord = await tx.emailVerificationToken.findUnique({
        where: { id: record.id },
        select: {
          id: true,
          userId: true,
          email: true,
          expiresAt: true,
          consumedAt: true,
          invalidatedAt: true,
        },
      });

      if (!freshRecord || freshRecord.invalidatedAt) {
        throw new Error("EMAIL_VERIFICATION_INVALID");
      }

      if (freshRecord.consumedAt) {
        throw new Error("EMAIL_VERIFICATION_CONSUMED");
      }

      if (freshRecord.expiresAt < verifiedAt) {
        await tx.emailVerificationToken.update({
          where: { id: freshRecord.id },
          data: {
            invalidatedAt: freshRecord.invalidatedAt ?? verifiedAt,
          },
        });
        throw new Error("EMAIL_VERIFICATION_EXPIRED");
      }

      await tx.user.update({
        where: { id: freshRecord.userId },
        data: {
          emailVerified: verifiedAt,
        },
      });

      await tx.emailVerificationToken.update({
        where: { id: freshRecord.id },
        data: {
          consumedAt: verifiedAt,
        },
      });

      await tx.emailVerificationToken.updateMany({
        where: {
          userId: freshRecord.userId,
          email: freshRecord.email,
          id: {
            not: freshRecord.id,
          },
          consumedAt: null,
          invalidatedAt: null,
        },
        data: {
          invalidatedAt: verifiedAt,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_VERIFICATION_INVALID") {
        return { status: "invalid" };
      }

      if (error.message === "EMAIL_VERIFICATION_CONSUMED") {
        return { status: "consumed" };
      }

      if (error.message === "EMAIL_VERIFICATION_EXPIRED") {
        return { status: "expired" };
      }
    }

    throw error;
  }

  return {
    status: "verified",
    email: record.user.email,
  };
}
