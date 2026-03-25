import "server-only";

import Twilio from "twilio";
import {
  OtpDeliveryFailedError,
  OtpProviderAuthError,
  OtpProviderRejectedError,
  OtpProviderUnavailableError,
  OtpRateLimitError,
  OtpVerificationFailedError,
  UnsupportedOtpChannelError,
} from "@/lib/otp/errors";
import {
  hasConfiguredProviderMessaging,
  hasConfiguredOtpManagedVerificationProvider,
  getTwilioMessagingConfig,
  getTwilioVerifyConfig,
} from "@/lib/otp/config";
import type {
  OtpChannel,
  OtpProvider,
  OtpProviderFeature,
  OtpTransportRequest,
  SendManagedOtpRequest,
  VerifyManagedOtpRequest,
} from "@/lib/otp/types";

function getTwilioErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return { raw: error };
  }

  const candidate = error as {
    status?: number;
    code?: number | string;
    message?: string;
    moreInfo?: string;
    details?: unknown;
  };

  return {
    status: candidate.status,
    code: candidate.code,
    message: candidate.message,
    moreInfo: candidate.moreInfo,
    details: candidate.details,
  };
}

function mapTwilioError(error: unknown, fallback: Error): Error {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: number }).status === "number"
  ) {
    const status = (error as { status: number }).status;

    if (status === 401 || status === 403) {
      return new OtpProviderAuthError("Twilio authentication failed.", {
        cause: error,
      });
    }

    if (status === 429) {
      return new OtpRateLimitError("Twilio rate limit exceeded.", {
        cause: error,
      });
    }

    if (status >= 500) {
      return new OtpProviderUnavailableError(
        "Twilio is temporarily unavailable.",
        {
          cause: error,
        },
      );
    }

    if (status >= 400) {
      return new OtpProviderRejectedError("Twilio rejected the OTP request.", {
        cause: error,
      });
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: number }).code === "number"
  ) {
    const code = (error as { code: number }).code;

    if (code === 20003) {
      return new OtpProviderAuthError("Twilio authentication failed.", {
        cause: error,
      });
    }

    if (code === 20429) {
      return new OtpRateLimitError("Twilio rate limit exceeded.", {
        cause: error,
      });
    }

    if (code === 21211 || code === 21614) {
      return new OtpProviderRejectedError(
        "Twilio rejected the destination phone number.",
        {
          cause: error,
        },
      );
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: string }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    if (
      code === "ECONNRESET" ||
      code === "ETIMEDOUT" ||
      code === "ENOTFOUND" ||
      code === "ECONNREFUSED"
    ) {
      return new OtpProviderUnavailableError("Twilio connection failed.", {
        cause: error,
      });
    }
  }

  return fallback;
}

function supportsTwilioChannel(
  channel: OtpChannel,
  feature: OtpProviderFeature,
): boolean {
  return channel === "sms" && (feature === "messaging" || feature === "managed_verification");
}

function getMessagingClient() {
  const config = getTwilioMessagingConfig();
  return {
    client: Twilio(config.accountSid, config.authToken),
    config,
  };
}

function getVerifyClient() {
  const config = getTwilioVerifyConfig();
  return {
    client: Twilio(config.accountSid, config.authToken),
    config,
  };
}

export class TwilioOtpProvider implements OtpProvider {
  readonly name = "twilio" as const;

  supportsChannel(channel: OtpChannel, feature: OtpProviderFeature): boolean {
    return supportsTwilioChannel(channel, feature);
  }

  async sendMessage(
    input: OtpTransportRequest,
  ): Promise<{ provider: "twilio" }> {
    if (!this.supportsChannel(input.channel, "messaging")) {
      throw new UnsupportedOtpChannelError(input.channel, this.name, "messaging");
    }

    if (!hasConfiguredProviderMessaging(this.name)) {
      throw new OtpProviderUnavailableError(
        "Twilio messaging is not configured for OTP delivery.",
      );
    }

    try {
      const { client, config } = getMessagingClient();

      await client.messages.create({
        to: input.phone,
        body: input.message,
        messagingServiceSid: config.messagingServiceSid,
      });

      return { provider: this.name };
    } catch (error) {
      console.error("[otp][twilio] message send failed", getTwilioErrorDetails(error));
      throw mapTwilioError(
        error,
        new OtpDeliveryFailedError("Twilio failed to deliver the OTP message.", {
          cause: error,
        }),
      );
    }
  }

  async sendVerification(
    input: SendManagedOtpRequest,
  ): Promise<{ status: string }> {
    if (!this.supportsChannel(input.channel, "managed_verification")) {
      throw new UnsupportedOtpChannelError(
        input.channel,
        this.name,
        "managed_verification",
      );
    }

    if (!hasConfiguredOtpManagedVerificationProvider()) {
      throw new OtpProviderUnavailableError(
        "Twilio Verify is not configured for managed OTP verification.",
      );
    }

    try {
      const { client, config } = getVerifyClient();
      const verification = await client.verify.v2
        .services(config.verifyServiceSid)
        .verifications.create({
          to: input.phone,
          channel: input.channel,
        });

      return { status: verification.status };
    } catch (error) {
      console.error("[otp][twilio] verify send failed", getTwilioErrorDetails(error));
      throw mapTwilioError(
        error,
        new OtpDeliveryFailedError("Twilio Verify failed to send the OTP.", {
          cause: error,
        }),
      );
    }
  }

  async verifyCode(
    input: VerifyManagedOtpRequest,
  ): Promise<{ approved: boolean; status: string }> {
    if (!this.supportsChannel(input.channel, "managed_verification")) {
      throw new UnsupportedOtpChannelError(
        input.channel,
        this.name,
        "managed_verification",
      );
    }

    if (!hasConfiguredOtpManagedVerificationProvider()) {
      throw new OtpProviderUnavailableError(
        "Twilio Verify is not configured for managed OTP verification.",
      );
    }

    try {
      const { client, config } = getVerifyClient();
      const verificationCheck = await client.verify.v2
        .services(config.verifyServiceSid)
        .verificationChecks.create({
          to: input.phone,
          code: input.code,
        });

      return {
        approved: verificationCheck.status === "approved",
        status: verificationCheck.status,
      };
    } catch (error) {
      console.error("[otp][twilio] verify check failed", getTwilioErrorDetails(error));
      throw mapTwilioError(
        error,
        new OtpVerificationFailedError(
          "Twilio Verify failed to verify the OTP.",
          {
            cause: error,
          },
        ),
      );
    }
  }
}
