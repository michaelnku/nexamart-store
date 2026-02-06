"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

type Input = {
  subtotalUSD: number;
  shippingUSD: number;
};

type EligibleCoupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  discountAmount: number;
};

type Result = {
  coupons: EligibleCoupon[];
};

const calculateDiscount = (
  type: string,
  value: number,
  subtotalUSD: number,
  shippingUSD: number,
  maxDiscount?: number | null,
) => {
  if (type === "PERCENTAGE") {
    let amount = (subtotalUSD * value) / 100;
    if (maxDiscount) amount = Math.min(amount, maxDiscount);
    return amount;
  }

  if (type === "FIXED") {
    return Math.min(value, subtotalUSD);
  }

  if (type === "FREE_SHIPPING") {
    return Math.min(shippingUSD, shippingUSD);
  }

  return 0;
};

export const getEligibleClaimedCouponsAction = async ({
  subtotalUSD,
  shippingUSD,
}: Input): Promise<Result> => {
  const userId = await CurrentUserId();
  if (!userId) return { coupons: [] };

  const orderCount = await prisma.order.count({ where: { userId } });

  const claims = await prisma.couponClaim.findMany({
    where: { userId },
    orderBy: { claimedAt: "desc" },
    include: { coupon: true },
  });

  const now = new Date();
  const coupons: EligibleCoupon[] = [];

  for (const claim of claims) {
    const coupon = claim.coupon;

    if (!coupon.isActive) continue;
    if (coupon.validFrom && coupon.validFrom > now) continue;
    if (coupon.validTo && coupon.validTo < now) continue;
    if (coupon.minOrderAmount && subtotalUSD < coupon.minOrderAmount) continue;
    if (coupon.appliesTo === "FIRST_ORDER" && orderCount > 0) continue;

    const [usageCount, userUsageCount] = await Promise.all([
      prisma.couponUsage.count({ where: { couponId: coupon.id } }),
      prisma.couponUsage.count({ where: { couponId: coupon.id, userId } }),
    ]);

    if (coupon.usageLimit && usageCount >= coupon.usageLimit) continue;
    if (coupon.perUserLimit && userUsageCount >= coupon.perUserLimit) continue;

    const discountAmount = calculateDiscount(
      coupon.type,
      coupon.value,
      subtotalUSD,
      shippingUSD,
      coupon.maxDiscount,
    );

    coupons.push({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    });
  }

  return { coupons };
};
