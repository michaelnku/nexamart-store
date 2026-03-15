import "server-only";

import { OtpConfigError } from "@/lib/otp/errors";
import type { OtpProviderName } from "@/lib/otp/types";

const SUPPORTED_PROVIDER_NAMES: OtpProviderName[] = ["twilio", "vonage", "plivo"];

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new OtpConfigError(`Missing required OTP environment variable: ${name}`);
  }
  return value;
}

function parseProviderName(raw: string): OtpProviderName {
  if (SUPPORTED_PROVIDER_NAMES.includes(raw as OtpProviderName)) {
    return raw as OtpProviderName;
  }

  throw new OtpConfigError(
    `Unsupported OTP provider "${raw}". Supported providers: ${SUPPORTED_PROVIDER_NAMES.join(", ")}.`,
  );
}

export function getConfiguredSmsProviderNames(): OtpProviderName[] {
  const configured =
    process.env.OTP_SMS_PROVIDERS?.trim() ||
    process.env.OTP_SMS_PROVIDER?.trim() ||
    process.env.OTP_PROVIDER?.trim() ||
    "twilio";

  const providerNames = configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(parseProviderName);

  if (providerNames.length === 0) {
    throw new OtpConfigError("At least one OTP SMS provider must be configured.");
  }

  return providerNames;
}

export function getPrimaryManagedVerificationProviderName(): OtpProviderName {
  const explicit = process.env.OTP_MANAGED_VERIFICATION_PROVIDER?.trim();
  if (explicit) {
    return parseProviderName(explicit);
  }

  return getConfiguredSmsProviderNames()[0];
}

export function getTwilioMessagingConfig() {
  return {
    accountSid: readRequiredEnv("TWILIO_ACCOUNT_SID"),
    authToken: readRequiredEnv("TWILIO_AUTH_TOKEN"),
    phoneNumber: process.env.TWILIO_PHONE_NUMBER?.trim() || "",
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM?.trim() || "",
  };
}

export function hasTwilioMessagingConfig(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim(),
  );
}

export function hasTwilioWhatsappConfig(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim(),
  );
}

export function getTwilioVerifyConfig() {
  return {
    accountSid: readRequiredEnv("TWILIO_ACCOUNT_SID"),
    authToken: readRequiredEnv("TWILIO_AUTH_TOKEN"),
    verifyServiceSid: readRequiredEnv("TWILIO_VERIFY_SERVICE_SID"),
  };
}

export function hasConfiguredOtpMessagingProvider(): boolean {
  const providers = getConfiguredSmsProviderNames();

  return providers.some((provider) => {
    switch (provider) {
      case "twilio":
        return hasTwilioMessagingConfig();
      case "vonage":
      case "plivo":
        return false;
    }
  });
}

export function hasConfiguredProviderMessaging(provider: OtpProviderName): boolean {
  switch (provider) {
    case "twilio":
      return hasTwilioMessagingConfig();
    case "vonage":
    case "plivo":
      return false;
  }
}

export function isOtpWhatsappEnabled(): boolean {
  return process.env.OTP_WHATSAPP_ENABLED?.trim().toLowerCase() === "true";
}

export function hasConfiguredOtpManagedVerificationProvider(): boolean {
  const provider = getPrimaryManagedVerificationProviderName();

  switch (provider) {
    case "twilio":
      return Boolean(
          process.env.TWILIO_ACCOUNT_SID?.trim() &&
          process.env.TWILIO_AUTH_TOKEN?.trim() &&
          process.env.TWILIO_VERIFY_SERVICE_SID?.trim(),
      );
    case "vonage":
    case "plivo":
      return false;
  }

  return false;
}
