import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt },
  });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p>
        <a href="${resetLink}">Reset Password</a>
      </p>
      <p>This link expires in 30 minutes.</p>
    `,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Invalid or expired token");
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email: record.email },
    data: { password: hashed },
  });

  await prisma.passwordResetToken.delete({
    where: { token },
  });
}
