import { otpService } from "@/lib/otp";

export async function sendOtpSms(phone: string, otp: string) {
  await otpService.sendLocalDeliveryOtpMessage(
    phone,
    `NexaMart Delivery Code: ${otp}. Give this code to the dispatch rider ONLY at delivery.`,
  );
}
