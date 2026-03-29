import { prisma } from "@/lib/prisma";

export async function toggleRiderAvailabilityFlow({
  userId,
  goOnline,
}: {
  userId: string;
  goOnline: boolean;
}) {
  const profile = await prisma.riderProfile.findUnique({
    where: { userId },
  });

  if (!profile) return { error: "Profile not found" } as const;

  if (!profile.isVerified) {
    return { error: "Your account is not verified" } as const;
  }

  if (goOnline) {
    const hasActiveSchedule = await prisma.riderSchedule.findFirst({
      where: {
        riderId: userId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!hasActiveSchedule) {
      return { error: "Set your schedule before going online" } as const;
    }
  }

  await prisma.riderProfile.update({
    where: { userId },
    data: { isAvailable: goOnline },
  });

  return { success: true } as const;
}
