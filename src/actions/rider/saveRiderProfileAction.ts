"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId, CurrentRole } from "@/lib/currentUser";
import { RiderProfileDTO } from "@/lib/types";
import {
  riderProfileSchema,
  riderProfileSchemaType,
} from "@/lib/zodValidation";

export async function saveRiderProfileAction(
  rawData: riderProfileSchemaType,
): Promise<{ success?: RiderProfileDTO; error?: string }> {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId) return { error: "Unauthorized" };
  if (role !== "RIDER") return { error: "Forbidden" };

  const parsed = riderProfileSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: parsed.error.message ?? "Invalid input",
    };
  }

  const {
    vehicleType,
    plateNumber,
    licenseNumber,
    vehicleColor,
    vehicleModel,
    isAvailable,
  } = parsed.data;

  const normalizedLicenseNumber = licenseNumber ?? "";
  const normalizedVehicleColor = vehicleColor ?? "";
  const normalizedVehicleModel = vehicleModel ?? "";

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const existing = await tx.riderProfile.findUnique({
        where: { userId },
      });

      // 🚨 Prevent duplicate plate numbers (atomic)
      const plateConflict = await tx.riderProfile.findFirst({
        where: {
          plateNumber,
          NOT: { userId },
        },
        select: { id: true },
      });

      if (plateConflict) {
        throw new Error("Plate number is already registered");
      }

      // 🆕 FIRST-TIME REGISTRATION
      if (!existing) {
        return await tx.riderProfile.create({
          data: {
            userId,
            vehicleType,
            plateNumber,
            licenseNumber: normalizedLicenseNumber,
            vehicleColor: normalizedVehicleColor,
            vehicleModel: normalizedVehicleModel,
            isAvailable: false, // cannot go online until verified
          },
        });
      }

      // 🔁 UPDATE FLOW

      const vehicleChanged =
        existing.vehicleType !== vehicleType ||
        existing.plateNumber !== plateNumber ||
        existing.licenseNumber !== normalizedLicenseNumber ||
        existing.vehicleColor !== normalizedVehicleColor ||
        existing.vehicleModel !== normalizedVehicleModel;

      return await tx.riderProfile.update({
        where: { userId },
        data: {
          vehicleType,
          plateNumber,
          licenseNumber: normalizedLicenseNumber,
          vehicleColor: normalizedVehicleColor,
          vehicleModel: normalizedVehicleModel,

          // prevent unverified riders from going online
          isAvailable: existing.isVerified && isAvailable ? isAvailable : false,

          // if vehicle identity changed → require re-verification
          ...(vehicleChanged && {
            isVerified: false,
            verifiedAt: null,
          }),
        },
      });
    });

    return {
      success: {
        vehicleType: profile.vehicleType,
        plateNumber: profile.plateNumber,
        licenseNumber: profile.licenseNumber,
        vehicleColor: profile.vehicleColor,
        vehicleModel: profile.vehicleModel,
        isVerified: profile.isVerified,
        isAvailable: profile.isAvailable,
      },
    };
  } catch (error: any) {
    if (error?.message === "Plate number is already registered") {
      return { error: error.message };
    }

    console.error("Rider profile save error:", error);
    return { error: "Failed to save rider profile" };
  }
}

export async function getRiderProfileAction(): Promise<{
  success?: RiderProfileDTO;
  error?: string;
}> {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId) return { error: "Unauthorized" };
  if (role !== "RIDER") return { error: "Forbidden" };

  const profile = await prisma.riderProfile.findUnique({
    where: { userId },
  });

  if (!profile) return { error: "Rider profile not found" };

  return {
    success: {
      vehicleType: profile.vehicleType,
      plateNumber: profile.plateNumber,
      licenseNumber: profile.licenseNumber,
      vehicleColor: profile.vehicleColor,
      vehicleModel: profile.vehicleModel,
      isVerified: profile.isVerified,
      isAvailable: profile.isAvailable,
    },
  };
}

export async function toggleRiderAvailabilityAction(
  goOnline: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId) return { error: "Unauthorized" };
  if (role !== "RIDER") return { error: "Forbidden" };

  const profile = await prisma.riderProfile.findUnique({
    where: { userId },
  });

  if (!profile) return { error: "Profile not found" };

  if (!profile.isVerified) {
    return { error: "Your account is not verified" };
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
      return { error: "Set your schedule before going online" };
    }
  }

  await prisma.riderProfile.update({
    where: { userId },
    data: { isAvailable: goOnline },
  });

  return { success: true };
}

export async function updateRiderProfileAction(
  rawData: riderProfileSchemaType,
): Promise<{ success?: boolean; error?: string }> {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId) return { error: "Unauthorized" };
  if (role !== "RIDER") return { error: "Forbidden" };

  const parsed = riderProfileSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const {
    vehicleType,
    plateNumber,
    licenseNumber,
    vehicleColor,
    vehicleModel,
  } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.riderProfile.findUnique({
        where: { userId },
      });

      if (!existing) {
        throw new Error("Profile not found");
      }

      const plateConflict = await tx.riderProfile.findFirst({
        where: {
          plateNumber,
          NOT: { userId },
        },
      });

      if (plateConflict) {
        throw new Error("Plate number already in use");
      }

      const vehicleChanged =
        existing.vehicleType !== vehicleType ||
        existing.plateNumber !== plateNumber ||
        existing.licenseNumber !== (licenseNumber ?? "") ||
        existing.vehicleColor !== (vehicleColor ?? "") ||
        existing.vehicleModel !== (vehicleModel ?? "");

      await tx.riderProfile.update({
        where: { userId },
        data: {
          vehicleType,
          plateNumber,
          licenseNumber: licenseNumber ?? "",
          vehicleColor: vehicleColor ?? "",
          vehicleModel: vehicleModel ?? "",
          isAvailable: false,
          ...(vehicleChanged && {
            isVerified: false,
            verifiedAt: null,
          }),
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message ?? "Update failed" };
  }
}

export async function deleteRiderProfileAction(): Promise<{
  success?: boolean;
  error?: string;
}> {
  const userId = await CurrentUserId();
  const role = await CurrentRole();

  if (!userId) return { error: "Unauthorized" };
  if (role !== "RIDER") return { error: "Forbidden" };

  const activeDelivery = await prisma.delivery.findFirst({
    where: {
      riderId: userId,
      status: {
        in: ["ASSIGNED", "IN_TRANSIT"],
      },
    },
  });

  if (activeDelivery) {
    return { error: "Cannot delete profile while delivering orders" };
  }

  await prisma.$transaction([
    prisma.riderSchedule.deleteMany({
      where: { riderId: userId },
    }),
    prisma.riderProfile.delete({
      where: { userId },
    }),
  ]);

  return { success: true };
}
