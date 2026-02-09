"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

export async function claimCouponAction(couponId: string) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: {
      id: true,
      isActive: true,
      isDeleted: true,
      validFrom: true,
      validTo: true,
      usageLimit: true,
      perUserLimit: true,
    },
  });

  if (!coupon || coupon.isDeleted) return { error: "Coupon not available" };
  if (!coupon.isActive) return { error: "Coupon is not active" };

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now)
    return { error: "Coupon is not active yet" };
  if (coupon.validTo && coupon.validTo < now)
    return { error: "Coupon has expired" };

  const [existing, usageCount, userUsageCount] = await Promise.all([
    prisma.couponClaim.findUnique({
      where: { couponId_userId: { couponId, userId } },
      select: { id: true },
    }),
    prisma.couponUsage.count({ where: { couponId } }),
    prisma.couponUsage.count({ where: { couponId, userId } }),
  ]);

  if (coupon.usageLimit && usageCount >= coupon.usageLimit) {
    return { error: "Coupon usage limit reached" };
  }

  if (coupon.perUserLimit && userUsageCount >= coupon.perUserLimit) {
    return { error: "You have reached the usage limit for this coupon" };
  }

  if (existing) return { success: true };

  await prisma.couponClaim.create({
    data: {
      couponId,
      userId,
    },
  });

  return { success: true };
}
