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

export function normalizePhoneToE164(phone: string): string {
  const sanitized = sanitizePhoneInput(phone);

  if (!E164_PHONE_PATTERN.test(sanitized)) {
    throw new InvalidOtpPhoneError(
      "Phone number must be a valid E.164 international number.",
    );
  }

  return sanitized;
}

export function normalizeOtpPhoneToE164(phone: string): string {
  return normalizePhoneToE164(phone);
}

export function buildPhoneDraft(countryCode: string, localNumber: string): string {
  const cleanCountry = countryCode.replace(/\D/g, "");
  const cleanLocal = localNumber.replace(/\D/g, "");

  if (!cleanCountry || !cleanLocal) {
    return "";
  }

  return `+${cleanCountry}${cleanLocal}`;
}

export function splitNormalizedPhone(phone?: string | null) {
  const raw = (phone ?? "").trim();
  if (!raw) return { countryCode: "", localNumber: "" };

  const normalized = raw.startsWith("+") ? raw.slice(1) : raw;
  const digits = normalized.replace(/\D/g, "");
  if (!digits) return { countryCode: "", localNumber: "" };

  const codeLength = digits.length > 10 ? Math.min(3, digits.length - 10) : 1;
  return {
    countryCode: digits.slice(0, codeLength),
    localNumber: digits.slice(codeLength),
  };
}
