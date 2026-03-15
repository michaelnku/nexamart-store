import "server-only";

import { getSmsOtpProviderChain } from "@/lib/otp/factory";
import { sendWithProviderFallbackChain } from "@/lib/otp/providerChain";
import type {
  OtpChannel,
  OtpPurpose,
  OtpStrategy,
} from "@/lib/otp/types";

export async function sendLocalDeliveryOtpMessage(phone: string, message: string, userId?: string) {
  return sendWithProviderFallbackChain(getSmsOtpProviderChain(), {
    phone,
    channel: "sms",
    purpose: "delivery",
    message,
    userId,
    strategy: "local_db",
  });
}

export async function sendTransportOtpMessage(input: {
  phone: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  message: string;
  userId?: string;
  strategy?: OtpStrategy;
}) {
  return sendWithProviderFallbackChain(getSmsOtpProviderChain(), input);
}
