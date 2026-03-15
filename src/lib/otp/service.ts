import "server-only";

import {
  sendLocalDeliveryOtpMessage,
  sendTransportOtpMessage,
} from "@/lib/otp/strategies/localDelivery";
import {
  sendProviderManagedOtp,
  verifyProviderManagedOtp,
} from "@/lib/otp/strategies/providerManaged";

export const otpService = {
  sendLocalDeliveryOtpMessage,
  sendTransportOtpMessage,
  sendProviderManagedOtp,
  verifyProviderManagedOtp,
};
