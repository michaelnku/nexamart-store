import z from "zod";
import { fileSchema } from "./shared.schemas";

export const verificationDocumentSchema = z.object({
  type: z.enum([
    "NATIONAL_ID",
    "PASSPORT",
    "DRIVER_LICENSE",
    "BUSINESS_LICENSE",
    "VEHICLE_REGISTRATION",
  ]),

  files: z.array(fileSchema).min(1).max(6),
});

export type VerificationDocumentInput = z.infer<
  typeof verificationDocumentSchema
>;
