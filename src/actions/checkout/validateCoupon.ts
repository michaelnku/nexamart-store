"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";

type ValidateCouponInput = {
  code: string;
  subtotalUSD: number;
  shippingUSD: number;
};

type ValidateCouponResult =
  | {
      success: true;
      coupon: { id: string; code: string; type: string; value: number };
      discountAmount: number;
    }
  | { error: string };

export const validateCouponAction = async ({
  code,
  subtotalUSD,
  shippingUSD,
}: ValidateCouponInput): Promise<ValidateCouponResult> => {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const normalized = code.trim();
  if (!normalized) return { error: "Enter a coupon code" };

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: { equals: normalized, mode: "insensitive" },
    },
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
    return {
      error: `Minimum order amount is $${coupon.minOrderAmount}`,
    };
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

  if (coupon.usageLimit && usageCount >= coupon.usageLimit) {
    return { error: "Coupon usage limit reached" };
  }

  if (coupon.perUserLimit && userUsageCount >= coupon.perUserLimit) {
    return { error: "You have reached the usage limit for this coupon" };
  }

  let discountAmount = 0;

  if (coupon.type === "PERCENTAGE") {
    discountAmount = (subtotalUSD * coupon.value) / 100;
    if (coupon.maxDiscount)
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }

  if (coupon.type === "FIXED") {
    discountAmount = Math.min(coupon.value, subtotalUSD);
  }

  if (coupon.type === "FREE_SHIPPING") {
    discountAmount = Math.min(shippingUSD, shippingUSD);
  }

  return {
    success: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    },
    discountAmount,
  };
};
