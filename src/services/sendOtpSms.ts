import { twilioClient } from "@/lib/twilio";

export async function sendOtpSms(phone: string, otp: string) {
  await twilioClient.messages.create({
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body: `NexaMart Delivery Code: ${otp}. Give this code to the rider ONLY at delivery.`,
  });
}
