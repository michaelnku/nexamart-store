"use server";

import { prisma } from "@/lib/prisma";

const PREFIX = "REF-";
const LENGTH = 6;

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = PREFIX;
  for (let i = 0; i < LENGTH; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export const createReferralCodeForUser = async (userId: string) => {
  if (!userId) return;

  const existing = await prisma.referralCode.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existing) return;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();

    try {
      await prisma.referralCode.create({
        data: {
          code,
          userId,
        },
      });
      return;
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }
  }
};
