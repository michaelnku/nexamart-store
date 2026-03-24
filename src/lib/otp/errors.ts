import type { OtpChannel, OtpProviderFeature, OtpProviderName } from "@/lib/otp/types";

export class OtpError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(message: string, code: string, options?: { cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.cause = options?.cause;
  }
}

export class OtpConfigError extends OtpError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "OTP_CONFIG_ERROR", options);
  }
}

export class InvalidOtpPhoneError extends OtpError {
  constructor(message = "Invalid phone number. Use a valid international number.", options?: { cause?: unknown }) {
    super(message, "OTP_INVALID_PHONE", options);
  }
}

export class UnsupportedOtpChannelError extends OtpError {
  constructor(
    channel: OtpChannel,
    provider: OtpProviderName | "provider_chain",
    feature: OtpProviderFeature,
  ) {
    super(
      provider === "provider_chain"
        ? `OTP channel "${channel}" is not supported by any configured provider for ${feature}.`
        : `OTP channel "${channel}" is not supported by provider "${provider}" for ${feature}.`,
      "OTP_UNSUPPORTED_CHANNEL",
    );
  }
}

export class OtpProviderUnavailableError extends OtpError {
  constructor(message = "OTP provider is unavailable.", options?: { cause?: unknown }) {
    super(message, "OTP_PROVIDER_UNAVAILABLE", options);
  }
}

export class OtpProviderAuthError extends OtpError {
  constructor(message = "OTP provider authentication failed.", options?: { cause?: unknown }) {
    super(message, "OTP_PROVIDER_AUTH_ERROR", options);
  }
}

export class OtpProviderRejectedError extends OtpError {
  constructor(message = "OTP provider rejected the request.", options?: { cause?: unknown }) {
    super(message, "OTP_PROVIDER_REJECTED", options);
  }
}

export class OtpDeliveryFailedError extends OtpError {
  constructor(message = "Failed to deliver OTP.", options?: { cause?: unknown }) {
    super(message, "OTP_DELIVERY_FAILED", options);
  }
}

export class OtpVerificationFailedError extends OtpError {
  constructor(message = "OTP verification failed.", options?: { cause?: unknown }) {
    super(message, "OTP_VERIFICATION_FAILED", options);
  }
}

export class OtpRateLimitError extends OtpError {
  constructor(message = "OTP rate limit exceeded.", options?: { cause?: unknown }) {
    super(message, "OTP_RATE_LIMIT", options);
  }
}

export function shouldFallbackOnOtpSendError(error: unknown): boolean {
  return (
    error instanceof OtpProviderUnavailableError ||
    error instanceof OtpProviderAuthError ||
    error instanceof OtpProviderRejectedError ||
    error instanceof OtpRateLimitError ||
    error instanceof UnsupportedOtpChannelError
  );
}
