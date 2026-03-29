export function normalizeOptionalVehicleFields({
  licenseNumber,
  vehicleColor,
  vehicleModel,
}: {
  licenseNumber?: string | null;
  vehicleColor?: string | null;
  vehicleModel?: string | null;
}) {
  return {
    licenseNumber: licenseNumber ?? "",
    vehicleColor: vehicleColor ?? "",
    vehicleModel: vehicleModel ?? "",
  };
}
