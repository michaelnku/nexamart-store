import { prisma } from "@/lib/prisma";
import type { RiderProfileDTO } from "@/lib/types";
import { normalizeOptionalVehicleFields } from "./riderProfileAction.normalizers";

export async function updateRiderProfileFlow({
  userId,
  data,
}: {
  userId: string;
  data: {
    vehicleType: RiderProfileDTO["vehicleType"];
    plateNumber: string;
    licenseNumber?: string | null;
    vehicleColor?: string | null;
    vehicleModel?: string | null;
  };
}) {
  const normalized = normalizeOptionalVehicleFields(data);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.riderProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new Error("Profile not found");
    }

    const plateConflict = await tx.riderProfile.findFirst({
      where: {
        plateNumber: data.plateNumber,
        NOT: { userId },
      },
    });

    if (plateConflict) {
      throw new Error("Plate number already in use");
    }

    const vehicleChanged =
      existing.vehicleType !== data.vehicleType ||
      existing.plateNumber !== data.plateNumber ||
      existing.licenseNumber !== normalized.licenseNumber ||
      existing.vehicleColor !== normalized.vehicleColor ||
      existing.vehicleModel !== normalized.vehicleModel;

    await tx.riderProfile.update({
      where: { userId },
      data: {
        vehicleType: data.vehicleType,
        plateNumber: data.plateNumber,
        licenseNumber: normalized.licenseNumber,
        vehicleColor: normalized.vehicleColor,
        vehicleModel: normalized.vehicleModel,
        isAvailable: false,
        ...(vehicleChanged && {
          isVerified: false,
          verifiedAt: null,
        }),
      },
    });
  });
}
