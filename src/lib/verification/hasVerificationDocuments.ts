import { prisma } from "@/lib/prisma";

export async function hasVerificationDocuments(userId: string) {
  const count = await prisma.verificationDocument.count({
    where: { userId },
  });

  return count > 0;
}
