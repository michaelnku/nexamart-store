"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";
import {
  createCouponSchema,
  createCouponSchemaType,
  updateCouponSchema,
  updateCouponSchemaType,
} from "@/lib/zodValidation";

const clampPercent = (value: number) => Math.min(Math.max(value, 1), 100);

const ensureAdmin = async () => {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }
  return { user };
};

export async function createCouponAction(data: createCouponSchemaType) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = createCouponSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid coupon data" };

  const payload = parsed.data;

  if (payload.validFrom && payload.validTo && payload.validFrom > payload.validTo)
    return { error: "Valid from must be before valid to" };

  const value =
    payload.type === "PERCENTAGE"
      ? clampPercent(payload.value)
      : payload.value;

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: payload.code.toUpperCase(),
        type: payload.type,
        value,
        minOrderAmount: payload.minOrderAmount ?? null,
        maxDiscount: payload.maxDiscount ?? null,
        usageLimit: payload.usageLimit ?? null,
        perUserLimit: payload.perUserLimit ?? null,
        appliesTo: payload.appliesTo,
        validFrom: payload.validFrom ?? null,
        validTo: payload.validTo ?? null,
        isActive: payload.isActive ?? true,
        createdByAdmin: true,
      },
    });

    return { coupon };
  } catch (err: any) {
    if (err?.code === "P2002") return { error: "Coupon code already exists" };
    return { error: "Failed to create coupon" };
  }
}

export async function updateCouponAction(data: updateCouponSchemaType) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = updateCouponSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid coupon data" };

  const payload = parsed.data;

  if (payload.validFrom && payload.validTo && payload.validFrom > payload.validTo)
    return { error: "Valid from must be before valid to" };

  const value =
    payload.type === "PERCENTAGE"
      ? clampPercent(payload.value)
      : payload.value;

  const isDeleted = payload.isDeleted ?? false;

  try {
    const coupon = await prisma.coupon.update({
      where: { id: payload.id },
      data: {
        code: payload.code.toUpperCase(),
        type: payload.type,
        value,
        minOrderAmount: payload.minOrderAmount ?? null,
        maxDiscount: payload.maxDiscount ?? null,
        usageLimit: payload.usageLimit ?? null,
        perUserLimit: payload.perUserLimit ?? null,
        appliesTo: payload.appliesTo,
        validFrom: payload.validFrom ?? null,
        validTo: payload.validTo ?? null,
        isActive: payload.isActive ?? true,
        isDeleted,
        deletedAt: isDeleted ? new Date() : null,
      },
    });

    return { coupon };
  } catch {
    return { error: "Failed to update coupon" };
  }
}

export async function toggleCouponActiveAction(id: string, isActive: boolean) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  await prisma.coupon.update({
    where: { id },
    data: { isActive },
  });

  return { success: true };
}

export async function softDeleteCouponAction(id: string) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  await prisma.coupon.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date(), isActive: false },
  });

  return { success: true };
}

export async function restoreCouponAction(id: string) {
  const auth = await ensureAdmin();
  if ("error" in auth) return { error: auth.error };

  await prisma.coupon.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });

  return { success: true };
}
