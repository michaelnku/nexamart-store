import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { sendOtpSms } from "@/services/sendOtpSms";

export async function sendDeliveryOtpToCustomer(
  userId: string,
  phone: string | null | undefined,
  otp: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return;
  }

  await pusherServer.trigger(`user-${user.id}`, "delivery-otp-generated", {
    message: "Your delivery OTP is ready.",
  });

  if (!phone) {
    return;
  }

  const hasSmsProvider =
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_PHONE_NUMBER);

  if (!hasSmsProvider) {
    return;
  }

  await sendOtpSms(phone, otp);
}
