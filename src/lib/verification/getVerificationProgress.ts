import { prisma } from "@/lib/prisma";

export type VerificationStep = {
  id: string;
  label: string;
  completed: boolean;
};

export async function getVerificationProgress(userId: string) {
  const [documents, verification, store, riderProfile, staffProfile] =
    await Promise.all([
      prisma.verificationDocument.count({
        where: { userId },
      }),

      prisma.verification.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),

      prisma.store.findUnique({
        where: { userId },
        select: {
          stripeAccountId: true,
          isVerified: true,
          isActive: true,
        },
      }),

      prisma.riderProfile.findUnique({
        where: { userId },
        select: { isVerified: true, stripeAccountId: true },
      }),

      prisma.staffProfile.findUnique({
        where: { userId },
        select: { isVerified: true, stripeAccountId: true },
      }),
    ]);

  const steps: VerificationStep[] = [
    {
      id: "documents",
      label: "Upload verification documents",
      completed: documents > 0,
    },
    {
      id: "identity",
      label: "Identity verification",
      completed: verification?.status === "VERIFIED",
    },
    {
      id: "payout",
      label: "Set-up your  stripe payout account",
      completed: Boolean(
        store?.stripeAccountId ||
        riderProfile?.stripeAccountId ||
        staffProfile?.stripeAccountId,
      ),
    },
    {
      id: "complete",
      label: "Verification complete",
      completed: verification?.status === "VERIFIED",
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;

  return {
    steps,
    progress: Math.round((completedSteps / steps.length) * 100),
  };
}
