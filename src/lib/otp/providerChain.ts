import "server-only";

import {
  OtpDeliveryFailedError,
  OtpConfigError,
  shouldFallbackOnOtpSendError,
  UnsupportedOtpChannelError,
} from "@/lib/otp/errors";
import {
  logOtpFallbackExhausted,
  logOtpProviderFallback,
  logOtpProviderSkipped,
  logOtpSendAttempt,
  logOtpSendFailure,
  logOtpSendSuccess,
} from "@/lib/otp/logging";
import { isOtpWhatsappEnabled } from "@/lib/otp/config";
import type { OtpProvider, OtpTransportSendRequest } from "@/lib/otp/types";

export async function sendWithProviderFallbackChain(
  providers: OtpProvider[],
  input: OtpTransportSendRequest,
) {
  if (input.channel === "whatsapp" && !isOtpWhatsappEnabled()) {
    throw new OtpConfigError("WhatsApp OTP delivery is disabled.");
  }

  const supportedProviders = providers.filter((provider) =>
    provider.supportsChannel(input.channel, "messaging"),
  );

  for (const provider of providers) {
    if (!provider.supportsChannel(input.channel, "messaging")) {
      logOtpProviderSkipped({
        phone: input.phone,
        channel: input.channel,
        purpose: input.purpose,
        strategy: input.strategy ?? "local_db",
        userId: input.userId,
        skippedProvider: provider.name,
        reason: `channel ${input.channel} unsupported`,
      });
    }
  }

  if (supportedProviders.length === 0) {
    throw new UnsupportedOtpChannelError(input.channel, "provider_chain", "messaging");
  }

  const attemptedProviders: OtpProvider["name"][] = [];
  let lastError: unknown;

  for (const [index, provider] of supportedProviders.entries()) {
    const context = {
      phone: input.phone,
      channel: input.channel,
      purpose: input.purpose,
      strategy: input.strategy ?? ("local_db" as const),
      provider: provider.name,
      userId: input.userId,
    };

    attemptedProviders.push(provider.name);
    logOtpSendAttempt(context);

    try {
      const result = await provider.sendMessage(input);
      logOtpSendSuccess(context);
      return result;
    } catch (error) {
      lastError = error;
      logOtpSendFailure(context, error);

      const nextProvider = supportedProviders[index + 1];
      if (!nextProvider || !shouldFallbackOnOtpSendError(error)) {
        break;
      }

      logOtpProviderFallback({
        ...context,
        attemptedProvider: provider.name,
        fallbackProvider: nextProvider.name,
      });
    }
  }

  logOtpFallbackExhausted(
    {
      phone: input.phone,
      channel: input.channel,
      purpose: input.purpose,
      strategy: input.strategy ?? "local_db",
      userId: input.userId,
      attemptedProviders,
    },
    lastError,
  );

  throw new OtpDeliveryFailedError(
    `All configured OTP providers failed: ${attemptedProviders.join(", ")}.`,
    { cause: lastError },
  );
}
