"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

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

  const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

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
      update: {},
      create: {
        userId: referral.referrerId,
        currency: "USD",
      },
    });

    const referredWallet = await tx.wallet.upsert({
      where: { userId: referral.referredId },
      update: {},
      create: {
        userId: referral.referredId,
        currency: "USD",
      },
    });

    await createDoubleEntryLedger(tx, {
      orderId: order.id,
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: referral.referrerId,
      toWalletId: referrerWallet.id,
      entryType: "REFUND",
      amount: REFERRER_BONUS,
      reference: `referral-referrer-${referral.id}`,
    });

    await createDoubleEntryLedger(tx, {
      orderId: order.id,
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: referral.referredId,
      toWalletId: referredWallet.id,
      entryType: "REFUND",
      amount: REFERRED_BONUS,
      reference: `referral-referred-${referral.id}`,
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
