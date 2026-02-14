import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import RiderSettingsClient from "./RiderSettingsClient";

export const RiderSettingsPage = async () => {
  const userId = await CurrentUserId();

  const riderProfile = await prisma.riderProfile.findUnique({
    where: { userId: userId! },
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

  return (
    <main className="space-y-8 max-w-4xl mx-auto">
      <RiderSettingsClient riderProfile={riderProfile} />
    </main>
  );
};
