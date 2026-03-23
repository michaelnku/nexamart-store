import { prisma } from "@/lib/prisma";
import { EmailNotVerifiedError } from "@/lib/email-verification/errors";

export async function requireVerifiedEmail(params: {
  userId: string;
  reason: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!user.emailVerified) {
    throw new EmailNotVerifiedError({
      userId: user.id,
      email: user.email,
      reason: params.reason,
    });
  }

  return user;
}
