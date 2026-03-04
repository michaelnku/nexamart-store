import { CurrentUserId, CurrentRole } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export async function getCurrentRiderProfile() {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId || role !== "RIDER") return null;

  return prisma.riderProfile.findUnique({
    where: { userId },
    select: {
      vehicleType: true,
      plateNumber: true,
      licenseNumber: true,
      vehicleColor: true,
      vehicleModel: true,
      isVerified: true,
      isAvailable: true,
    },
  });
}
