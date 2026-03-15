import "server-only";

import {
  getConfiguredSmsProviderNames,
  getPrimaryManagedVerificationProviderName,
} from "@/lib/otp/config";
import { OtpConfigError } from "@/lib/otp/errors";
import { TwilioOtpProvider } from "@/lib/otp/providers/twilio";
import type { OtpProvider, OtpProviderName } from "@/lib/otp/types";

function createOtpProvider(name: OtpProviderName): OtpProvider {
  switch (name) {
    case "twilio":
      return new TwilioOtpProvider();
    case "vonage":
    case "plivo":
      throw new OtpConfigError(
        `OTP provider "${name}" is configured but not implemented yet.`,
      );
  }
}

export function getSmsOtpProviderChain(): OtpProvider[] {
  return getConfiguredSmsProviderNames().map(createOtpProvider);
}

export function getManagedVerificationProvider(): OtpProvider {
  return createOtpProvider(getPrimaryManagedVerificationProviderName());
}
