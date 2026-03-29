import { prisma } from "@/lib/prisma";

export async function deleteRiderProfileFlow(userId: string) {
  const activeDelivery = await prisma.delivery.findFirst({
    where: {
      riderId: userId,
      status: {
        in: ["ASSIGNED", "PICKED_UP"],
      },
    },
  });

  if (activeDelivery) {
    return { error: "Cannot delete profile while delivering orders" } as const;
  }

  await prisma.$transaction([
    prisma.riderSchedule.deleteMany({
      where: { riderId: userId },
    }),
    prisma.riderProfile.delete({
      where: { userId },
    }),
  ]);

  return { success: true } as const;
}
