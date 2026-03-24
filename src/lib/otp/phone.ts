import "server-only";

import { InvalidOtpPhoneError } from "@/lib/otp/errors";

const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const NON_DIGIT_SEPARATORS_PATTERN = /[\s().-]/g;

function sanitizePhoneInput(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) {
    throw new InvalidOtpPhoneError("Phone number is required.");
  }

  const normalizedPrefix =
    trimmed.startsWith("00") && !trimmed.startsWith("+")
      ? `+${trimmed.slice(2)}`
      : trimmed;

  const cleaned = normalizedPrefix.replace(NON_DIGIT_SEPARATORS_PATTERN, "");

  if (!cleaned.startsWith("+")) {
    throw new InvalidOtpPhoneError(
      "Phone number must include an international country calling code.",
    );
  }

  const digits = cleaned.slice(1);
  if (!/^\d+$/.test(digits)) {
    throw new InvalidOtpPhoneError("Phone number contains invalid characters.");
  }

  return `+${digits}`;
}

export function normalizeOtpPhoneToE164(phone: string): string {
  const sanitized = sanitizePhoneInput(phone);

  if (!E164_PHONE_PATTERN.test(sanitized)) {
    throw new InvalidOtpPhoneError(
      "Phone number must be a valid E.164 international number.",
    );
  }

  return sanitized;
}
