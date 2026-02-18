import { prisma } from "@/lib/prisma";

const SYSTEM_USER_EMAIL = "system@nexamart.local";
const SYSTEM_USER_NAME = "NexaMart System";
const SYSTEM_USERNAME = "nexamart-system";

export async function getOrCreateSystemEscrowWallet() {
  const account = await getOrCreateSystemEscrowAccount();
  return account.walletId;
}

export async function getOrCreateSystemEscrowAccount() {
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_USER_EMAIL },
    update: {
      role: "SYSTEM",
    },
    create: {
      email: SYSTEM_USER_EMAIL,
      name: SYSTEM_USER_NAME,
      username: SYSTEM_USERNAME,
      role: "SYSTEM",
    },
    select: { id: true },
  });

  const wallet = await prisma.wallet.upsert({
    where: { userId: systemUser.id },
    update: {},
    create: {
      userId: systemUser.id,
      currency: "USD",
    },
    select: { id: true },
  });

  return {
    userId: systemUser.id,
    walletId: wallet.id,
  };
}
