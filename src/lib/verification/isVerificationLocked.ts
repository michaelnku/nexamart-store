import { prisma } from "@/lib/prisma";

export async function isVerificationLocked(userId: string) {
  const verification = await prisma.verification.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
    },
  });

  if (!verification) return false;

  if (verification.status === "PENDING") return true;
  if (verification.status === "VERIFIED") return true;

  return false;
}
