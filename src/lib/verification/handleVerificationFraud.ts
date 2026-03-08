import { prisma } from "@/lib/prisma";

const MAX_VERIFICATION_ATTEMPTS = 3;

export async function handleVerificationFraud(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      verificationFailedAttempts: true,
    },
  });

  if (!user) return;

  const attempts = user.verificationFailedAttempts + 1;

  if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationFailedAttempts: attempts,
        isBanned: true,
      },
    });

    return {
      banned: true,
      attempts,
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationFailedAttempts: attempts,
    },
  });

  return {
    banned: false,
    attempts,
  };
}
