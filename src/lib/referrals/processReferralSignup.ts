"use server";

import { prisma } from "@/lib/prisma";
import { ensureReferralExpiryJobInTx } from "@/lib/referrals/referralLifecycle";

export const processReferralSignup = async (
  userId: string,
  referralCode?: string | null,
) => {
  if (!userId || !referralCode) return;

  const code = referralCode.trim().toUpperCase();
  if (!code) return;

  const refCode = await prisma.referralCode.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    include: {
      user: {
        select: {
          id: true,
          isBanned: true,
          isDeleted: true,
          deletedAt: true,
          softBlockedUntil: true,
        },
      },
    },
  });

  if (!refCode) return;

  const existing = await prisma.referral.findUnique({
    where: { referredId: userId },
  });

  if (existing) return;

  const now = new Date();
  const referrerBlockedByPolicy = Boolean(
    refCode.user.isBanned ||
      (refCode.user.softBlockedUntil &&
        refCode.user.softBlockedUntil.getTime() > now.getTime()),
  );
  const referrerStructurallyInvalid = Boolean(
    refCode.user.isDeleted || refCode.user.deletedAt,
  );

  await prisma.$transaction(async (tx) => {
    const referral = await tx.referral.create({
      data: {
        referrerId: refCode.userId,
        referredId: userId,
        referralCodeId: refCode.id,
        status: refCode.userId === userId
          ? "REJECTED"
          : referrerStructurallyInvalid
          ? "VOID"
          : referrerBlockedByPolicy
            ? "REJECTED"
            : "PENDING_QUALIFICATION",
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (
      refCode.userId !== userId &&
      !referrerBlockedByPolicy &&
      !referrerStructurallyInvalid
    ) {
      await ensureReferralExpiryJobInTx(tx, referral.id, referral.createdAt);
    }
  });
};
