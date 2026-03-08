import { prisma } from "@/lib/prisma";

export type VerificationStep = {
  id: string;
  label: string;
  completed: boolean;
};

export async function getVerificationProgress(userId: string) {
  const [documents, verification, store] = await Promise.all([
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
  ]);

  const steps: VerificationStep[] = [
    {
      id: "documents",
      label: "Upload documents",
      completed: documents > 0,
    },
    {
      id: "identity",
      label: "Identity verification",
      completed: verification?.status === "VERIFIED",
    },
    {
      id: "payout",
      label: "Stripe payout setup",
      completed: Boolean(store?.stripeAccountId),
    },
    {
      id: "activated",
      label: "Account activated",
      completed: Boolean(store?.isVerified && store?.isActive),
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;

  return {
    steps,
    progress: Math.round((completedSteps / steps.length) * 100),
  };
}
