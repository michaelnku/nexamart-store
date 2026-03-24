import "server-only";

import { getManagedVerificationProvider } from "@/lib/otp/factory";
import {
  logOtpSendAttempt,
  logOtpSendFailure,
  logOtpSendSuccess,
  logOtpVerifyAttempt,
  logOtpVerifyFailure,
  logOtpVerifySuccess,
} from "@/lib/otp/logging";
import { normalizeOtpPhoneToE164 } from "@/lib/otp/phone";
import type { SendManagedOtpRequest, VerifyManagedOtpRequest } from "@/lib/otp/types";

export async function sendProviderManagedOtp(input: SendManagedOtpRequest) {
  const provider = getManagedVerificationProvider();
  const normalizedPhone = normalizeOtpPhoneToE164(input.phone);
  const context = {
    phone: normalizedPhone,
    channel: input.channel,
    purpose: input.purpose,
    strategy: "provider_managed" as const,
    provider: provider.name,
    userId: input.userId,
  };

  logOtpSendAttempt(context);

  try {
    const result = await provider.sendVerification({
      ...input,
      phone: normalizedPhone,
    });
    logOtpSendSuccess(context);
    return { provider: provider.name, ...result };
  } catch (error) {
    logOtpSendFailure(context, error);
    throw error;
  }
}

export async function verifyProviderManagedOtp(input: VerifyManagedOtpRequest) {
  const provider = getManagedVerificationProvider();
  const normalizedPhone = normalizeOtpPhoneToE164(input.phone);
  const context = {
    phone: normalizedPhone,
    channel: input.channel,
    purpose: input.purpose,
    strategy: "provider_managed" as const,
    provider: provider.name,
    userId: input.userId,
  };

  logOtpVerifyAttempt(context);

  try {
    const result = await provider.verifyCode({
      ...input,
      phone: normalizedPhone,
    });
    if (result.approved) {
      logOtpVerifySuccess(context);
    } else {
      logOtpVerifyFailure(context, new Error(`Verification status: ${result.status}`));
    }
    return { provider: provider.name, ...result };
  } catch (error) {
    logOtpVerifyFailure(context, error);
    throw error;
  }
}
