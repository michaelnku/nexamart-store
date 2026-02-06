"use server";

import { prisma } from "@/lib/prisma";

type Input = {
  userId: string;
  couponId?: string | null;
  subtotalUSD: number;
  shippingUSD: number;
};

type Result =
  | { coupon: null; discountAmount: 0 }
  | {
      coupon: { id: string; type: string; value: number };
      discountAmount: number;
    }
  | { error: string };

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

export const resolveCouponForOrder = async ({
  userId,
  couponId,
  subtotalUSD,
  shippingUSD,
}: Input): Promise<Result> => {
  if (!couponId) return { coupon: null, discountAmount: 0 };

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon) return { error: "Coupon not found" };
  if (coupon.isDeleted) return { error: "Coupon not available" };
  if (!coupon.isActive) return { error: "Coupon is not active" };

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now)
    return { error: "Coupon is not active yet" };
  if (coupon.validTo && coupon.validTo < now)
    return { error: "Coupon has expired" };

  if (coupon.appliesTo === "FIRST_ORDER") {
    const orderCount = await prisma.order.count({ where: { userId } });
    if (orderCount > 0) return { error: "Coupon is for first order only" };
  }

  if (coupon.minOrderAmount && subtotalUSD < coupon.minOrderAmount) {
    return { error: `Minimum order amount is $${coupon.minOrderAmount}` };
  }

  const [usageCount, userUsageCount, claimed] = await Promise.all([
    prisma.couponUsage.count({ where: { couponId: coupon.id } }),
    prisma.couponUsage.count({ where: { couponId: coupon.id, userId } }),
    prisma.couponClaim.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId } },
      select: { id: true },
    }),
  ]);

  if (!claimed) return { error: "Coupon not claimed yet" };
  if (coupon.usageLimit && usageCount >= coupon.usageLimit)
    return { error: "Coupon usage limit reached" };
  if (coupon.perUserLimit && userUsageCount >= coupon.perUserLimit)
    return { error: "You have reached the usage limit for this coupon" };

  const discountAmount = calculateDiscount(
    coupon.type,
    coupon.value,
    subtotalUSD,
    shippingUSD,
    coupon.maxDiscount,
  );

  return {
    coupon: { id: coupon.id, type: coupon.type, value: coupon.value },
    discountAmount,
  };
};
