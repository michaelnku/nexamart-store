import { normalizePhoneToE164 } from "@/lib/otp/phone";
import type { AddressActionInput, NormalizedAddressInput } from "./address.types";

export function normalizeAddressInput(
  values: AddressActionInput,
): NormalizedAddressInput {
  const normalizedPhone = normalizePhoneToE164(values.phone);

  return {
    label: values.label,
    fullName: values.fullName,
    phone: normalizedPhone,
    street: values.street,
    city: values.city,
    state: values.state,
    country: values.country ?? "",
    postalCode: values.postalCode ?? "",
    isDefault: values.isDefault ?? false,
  };
}
