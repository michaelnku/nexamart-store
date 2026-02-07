"use server";

import { prisma } from "@/lib/prisma";

const REFERRED_BONUS = 5;
const REFERRER_BONUS = 10;

export const applyReferralRewardsForPaidOrder = async (orderId: string) => {
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, isPaid: true },
  });

  if (!order || !order.isPaid) return;

  const paidOrderCount = await prisma.order.count({
    where: { userId: order.userId, isPaid: true },
  });

  if (paidOrderCount !== 1) return;

  const referral = await prisma.referral.findUnique({
    where: { referredId: order.userId },
  });

  if (!referral || referral.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    const now = new Date();

    await tx.referral.update({
      where: { id: referral.id },
      data: {
        status: "QUALIFIED",
        qualifiedAt: now,
        orderId: order.id,
      },
    });

    const referrerWallet = await tx.wallet.upsert({
      where: { userId: referral.referrerId },
      update: {
        balance: { increment: REFERRER_BONUS },
        totalEarnings: { increment: REFERRER_BONUS },
      },
      create: {
        userId: referral.referrerId,
        balance: REFERRER_BONUS,
        totalEarnings: REFERRER_BONUS,
        pending: 0,
        currency: "USD",
      },
    });

    const referredWallet = await tx.wallet.upsert({
      where: { userId: referral.referredId },
      update: {
        balance: { increment: REFERRED_BONUS },
        totalEarnings: { increment: REFERRED_BONUS },
      },
      create: {
        userId: referral.referredId,
        balance: REFERRED_BONUS,
        totalEarnings: REFERRED_BONUS,
        pending: 0,
        currency: "USD",
      },
    });

    const referrerTx = await tx.transaction.create({
      data: {
        walletId: referrerWallet.id,
        userId: referral.referrerId,
        amount: REFERRER_BONUS,
        type: "EARNING",
        status: "SUCCESS",
        description: "Referral bonus",
      },
    });

    const referredTx = await tx.transaction.create({
      data: {
        walletId: referredWallet.id,
        userId: referral.referredId,
        amount: REFERRED_BONUS,
        type: "EARNING",
        status: "SUCCESS",
        description: "Referral signup bonus",
      },
    });

    await tx.referralReward.createMany({
      data: [
        {
          referralId: referral.id,
          beneficiaryId: referral.referrerId,
          role: "REFERRER",
          amount: REFERRER_BONUS,
          status: "PAID",
          issuedAt: now,
          transactionId: referrerTx.id,
        },
        {
          referralId: referral.id,
          beneficiaryId: referral.referredId,
          role: "REFERRED",
          amount: REFERRED_BONUS,
          status: "PAID",
          issuedAt: now,
          transactionId: referredTx.id,
        },
      ],
    });

    await tx.referral.update({
      where: { id: referral.id },
      data: {
        status: "REWARDED",
        rewardedAt: now,
      },
    });
  });
};
