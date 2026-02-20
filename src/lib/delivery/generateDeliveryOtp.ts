import { Prisma } from "@/generated/prisma";
import { generateOtp, hashOtp } from "@/lib/otp";

const OTP_TTL_MS = 10 * 60 * 1000;

type Tx = Prisma.TransactionClient;

export async function generateDeliveryOTP(
  tx: Tx,
  deliveryId: string,
): Promise<string | null> {
  const now = new Date();

  const delivery = await tx.delivery.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      otpHash: true,
      otpExpiresAt: true,
    },
  });

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  if (
    delivery.otpHash &&
    delivery.otpExpiresAt &&
    delivery.otpExpiresAt > now
  ) {
    return null;
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const otpExpiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await tx.delivery.update({
    where: { id: deliveryId },
    data: {
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
      isLocked: false,
      lockedAt: null,
    },
  });

  return otp;
}
