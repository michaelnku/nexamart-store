"use server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";

async function checkRateLimit(email: string, ip?: string | null) {
  const fifteenMinutesAgo = new Date(Date.now() - 1000 * 60 * 15);

  const count = await prisma.passwordResetAttempt.count({
    where: {
      email,
      ip,
      createdAt: { gte: fifteenMinutesAgo },
    },
  });

  if (count >= 5) {
    throw new Error("Too many reset attempts. Try again later.");
  }

  await prisma.passwordResetAttempt.create({
    data: { email, ip: ip ?? undefined },
  });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function forgotPassword(email: string, ip?: string | null) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await checkRateLimit(email, ip);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  email = email.toLowerCase().trim();

  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt },
  });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${rawToken}`;

  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p>
        <a href="${resetLink}">Reset Password</a>
      </p>
      
      <p>
        Or copy and paste the following link into your browser:<br/>
        <small>${resetLink}</small>
      </p>
      <p>This link expires in 30 minutes.</p>
    `,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const hashedToken = hashToken(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Invalid or expired token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const email = record.email.toLowerCase().trim();

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({
    where: { token: hashedToken },
  });

  return {
    success: true,
    message: "Your password was changed. If this wasn't you, contact support.",
  };
}
