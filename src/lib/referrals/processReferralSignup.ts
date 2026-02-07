"use server";

import { prisma } from "@/lib/prisma";

export const processReferralSignup = async (
  userId: string,
  referralCode?: string | null,
) => {
  if (!userId || !referralCode) return;

  const code = referralCode.trim().toUpperCase();
  if (!code) return;

  const refCode = await prisma.referralCode.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
  });

  if (!refCode) return;
  if (refCode.userId === userId) return;

  const existing = await prisma.referral.findUnique({
    where: { referredId: userId },
  });

  if (existing) return;

  await prisma.referral.create({
    data: {
      referrerId: refCode.userId,
      referredId: userId,
      referralCodeId: refCode.id,
      status: "PENDING",
    },
  });
};
