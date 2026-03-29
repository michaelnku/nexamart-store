import z from "zod";

const optionalTrimmedField = z
  .string()
  .trim()
  .max(64, "Must be at most 64 characters")
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .refine(
    (value) => value === undefined || value.length >= 2,
    "Must be at least 2 characters",
  );

export const riderProfileSchema = z.object({
  vehicleType: z
    .string()
    .trim()
    .min(2, "Vehicle type is required")
    .max(40, "Vehicle type must be at most 40 characters"),
  plateNumber: z
    .string()
    .trim()
    .min(2, "Plate number is required")
    .max(30, "Plate number must be at most 30 characters"),
  licenseNumber: optionalTrimmedField,
  vehicleColor: optionalTrimmedField,
  vehicleModel: optionalTrimmedField,
  isAvailable: z.boolean().default(false),
});

export type riderProfileSchemaType = z.infer<typeof riderProfileSchema>;
