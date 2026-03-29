import type { RiderProfileDTO } from "@/lib/types";

export function mapRiderProfileToDTO(profile: {
  vehicleType: RiderProfileDTO["vehicleType"];
  plateNumber: string;
  licenseNumber: string;
  vehicleColor: string;
  vehicleModel: string;
  isVerified: boolean;
  isAvailable: boolean;
}): RiderProfileDTO {
  return {
    vehicleType: profile.vehicleType,
    plateNumber: profile.plateNumber,
    licenseNumber: profile.licenseNumber,
    vehicleColor: profile.vehicleColor,
    vehicleModel: profile.vehicleModel,
    isVerified: profile.isVerified,
    isAvailable: profile.isAvailable,
  };
}
