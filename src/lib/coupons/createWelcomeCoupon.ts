"use server";

import { prisma } from "@/lib/prisma";

const CODE_PREFIX = "WELCOME-";
const CODE_LENGTH = 6;

const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = CODE_PREFIX;
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export const createWelcomeCouponForUser = async (userId: string) => {
  if (!userId) return;

  const existingClaim = await prisma.couponClaim.findFirst({
    where: {
      userId,
      coupon: {
        code: { startsWith: CODE_PREFIX },
      },
    },
    select: { id: true },
  });

  if (existingClaim) return;

  const now = new Date();

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();

    try {
      await prisma.$transaction(async (tx) => {
        const coupon = await tx.coupon.create({
          data: {
            code,
            type: "PERCENTAGE",
            value: 10,
            usageLimit: 1,
            perUserLimit: 1,
            validFrom: now,
            validTo: null,
            appliesTo: "FIRST_ORDER",
            createdByAdmin: false,
          },
        });

        await tx.couponClaim.create({
          data: {
            couponId: coupon.id,
            userId,
          },
        });
      });

      return;
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }
  }
};
