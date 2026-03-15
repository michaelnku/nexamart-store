import type {
  OtpChannel,
  OtpProviderName,
  OtpPurpose,
  OtpStrategy,
} from "@/lib/otp/types";

function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}`;
}

type OtpLogContext = {
  phone: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  strategy: OtpStrategy;
  provider?: OtpProviderName;
  userId?: string;
};

function withMaskedPhone(context: OtpLogContext) {
  return {
    ...context,
    phone: maskPhone(context.phone),
  };
}

export function logOtpSendAttempt(context: OtpLogContext) {
  console.info("[otp] send attempt", withMaskedPhone(context));
}

export function logOtpSendSuccess(context: OtpLogContext) {
  console.info("[otp] send success", withMaskedPhone(context));
}

export function logOtpSendFailure(context: OtpLogContext, error: unknown) {
  console.error("[otp] send failure", {
    ...withMaskedPhone(context),
    error: error instanceof Error ? error.message : error,
  });
}

export function logOtpProviderFallback(
  context: OtpLogContext & {
    attemptedProvider: OtpProviderName;
    fallbackProvider: OtpProviderName;
  },
) {
  console.warn("[otp] provider fallback", withMaskedPhone(context));
}

export function logOtpProviderSkipped(
  context: OtpLogContext & {
    skippedProvider: OtpProviderName;
    reason: string;
  },
) {
  console.info("[otp] provider skipped", withMaskedPhone(context));
}

export function logOtpFallbackExhausted(
  context: OtpLogContext & { attemptedProviders: OtpProviderName[] },
  error: unknown,
) {
  console.error("[otp] fallback exhausted", {
    ...withMaskedPhone(context),
    attemptedProviders: context.attemptedProviders,
    error: error instanceof Error ? error.message : error,
  });
}

export function logOtpVerifyAttempt(context: OtpLogContext) {
  console.info("[otp] verify attempt", withMaskedPhone(context));
}

export function logOtpVerifySuccess(context: OtpLogContext) {
  console.info("[otp] verify success", withMaskedPhone(context));
}

export function logOtpVerifyFailure(context: OtpLogContext, error: unknown) {
  console.error("[otp] verify failure", {
    ...withMaskedPhone(context),
    error: error instanceof Error ? error.message : error,
  });
}
