import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { sendOtpSms } from "@/services/sendOtpSms";

export type DeliveryOtpSendResult =
  | { success: true; channel: "SMS" | "PUSH_ONLY" }
  | {
      success: false;
      code:
        | "USER_NOT_FOUND"
        | "MISSING_PHONE"
        | "SMS_PROVIDER_UNAVAILABLE"
        | "OTP_SERVICE_UNAVAILABLE";
      message: string;
    };

export async function sendDeliveryOtpToCustomer(
  userId: string,
  phone: string | null | undefined,
  otp: string,
): Promise<DeliveryOtpSendResult> {
  console.info("[sendDeliveryOtpToCustomer] start", {
    userId,
    hasPhone: Boolean(phone),
    otpLength: otp.length,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    console.warn("[sendDeliveryOtpToCustomer] skipped: user not found", {
      userId,
    });
    return {
      success: false,
      code: "USER_NOT_FOUND",
      message: "Customer account was not found for OTP delivery.",
    };
  }

  await pusherServer.trigger(`user-${user.id}`, "delivery-otp-generated", {
    message: "Your delivery OTP is ready.",
  });

  console.info("[sendDeliveryOtpToCustomer] pusher event sent", {
    userId: user.id,
  });

  if (!phone) {
    console.warn("[sendDeliveryOtpToCustomer] skipped sms: missing phone", {
      userId: user.id,
    });
    return {
      success: false,
      code: "MISSING_PHONE",
      message: "Customer phone number is missing for OTP delivery.",
    };
  }

  const hasSmsProvider =
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_PHONE_NUMBER);

  if (!hasSmsProvider) {
    console.warn(
      "[sendDeliveryOtpToCustomer] skipped sms: twilio env not configured",
      {
        userId: user.id,
        phone,
      },
    );
    return {
      success: false,
      code: "SMS_PROVIDER_UNAVAILABLE",
      message: "OTP service temporarily unavailable.",
    };
  }

  console.info("[sendDeliveryOtpToCustomer] sending sms otp", {
    userId: user.id,
    phone,
  });

  try {
    await sendOtpSms(phone, otp);
    console.info("[sendDeliveryOtpToCustomer] sms otp sent", {
      userId: user.id,
      phone,
    });
    return { success: true, channel: "SMS" };
  } catch (error) {
    console.error("[sendDeliveryOtpToCustomer] sms otp failed", {
      userId: user.id,
      phone,
      error: error instanceof Error ? error.message : error,
    });
    return {
      success: false,
      code: "OTP_SERVICE_UNAVAILABLE",
      message: "OTP service temporarily unavailable.",
    };
  }
}
