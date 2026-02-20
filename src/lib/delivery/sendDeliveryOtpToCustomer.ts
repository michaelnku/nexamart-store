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
    otp,
    message: "Your delivery OTP is ready.",
  });

  if (!phone) {
    return;
  }

  try {
    await sendOtpSms(phone, otp);
  } catch (error) {
    console.error("Failed to send delivery OTP SMS:", error);
  }
}
