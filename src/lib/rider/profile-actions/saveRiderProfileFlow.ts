import { prisma } from "@/lib/prisma";
import type { RiderProfileDTO } from "@/lib/types";
import { normalizeOptionalVehicleFields } from "./riderProfileAction.normalizers";
import { mapRiderProfileToDTO } from "./riderProfileAction.mappers";

export async function saveRiderProfileFlow({
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
    isAvailable: boolean;
  };
}) {
  const normalized = normalizeOptionalVehicleFields(data);

  const profile = await prisma.$transaction(async (tx) => {
    const existing = await tx.riderProfile.findUnique({
      where: { userId },
    });

    const plateConflict = await tx.riderProfile.findFirst({
      where: {
        plateNumber: data.plateNumber,
        NOT: { userId },
      },
      select: { id: true },
    });

    if (plateConflict) {
      throw new Error("Plate number is already registered");
    }

    if (!existing) {
      return tx.riderProfile.create({
        data: {
          userId,
          vehicleType: data.vehicleType,
          plateNumber: data.plateNumber,
          licenseNumber: normalized.licenseNumber,
          vehicleColor: normalized.vehicleColor,
          vehicleModel: normalized.vehicleModel,
          isAvailable: false,
        },
      });
    }

    const vehicleChanged =
      existing.vehicleType !== data.vehicleType ||
      existing.plateNumber !== data.plateNumber ||
      existing.licenseNumber !== normalized.licenseNumber ||
      existing.vehicleColor !== normalized.vehicleColor ||
      existing.vehicleModel !== normalized.vehicleModel;

    return tx.riderProfile.update({
      where: { userId },
      data: {
        vehicleType: data.vehicleType,
        plateNumber: data.plateNumber,
        licenseNumber: normalized.licenseNumber,
        vehicleColor: normalized.vehicleColor,
        vehicleModel: normalized.vehicleModel,
        isAvailable: existing.isVerified && data.isAvailable ? data.isAvailable : false,
        ...(vehicleChanged && {
          isVerified: false,
          verifiedAt: null,
        }),
      },
    });
  });

  return mapRiderProfileToDTO(profile);
}
