import type { addressSchemaType } from "@/lib/zodValidation";
import { addressSchema } from "@/lib/zodValidation";

export function validateAddressInput(values: addressSchemaType) {
  return addressSchema.safeParse(values);
}
