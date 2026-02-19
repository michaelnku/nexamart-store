import { prisma } from "@/lib/prisma";

async function resolvePlatformUserId(): Promise<string> {
  const explicitPlatformUserId = process.env.PLATFORM_ESCROW_USER_ID;
  if (explicitPlatformUserId) {
    const user = await prisma.user.findUnique({
      where: { id: explicitPlatformUserId },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "ADMIN") {
      throw new Error("PLATFORM_ESCROW_USER_ID must reference an ADMIN user.");
    }
    return user.id;
  }

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!admin) {
    throw new Error(
      "Platform escrow account requires at least one ADMIN user in the database.",
    );
  }

  return admin.id;
}

export async function getOrCreateSystemEscrowWallet() {
  const account = await getOrCreateSystemEscrowAccount();
  return account.walletId;
}

export async function getOrCreateSystemEscrowAccount() {
  const userId = await resolvePlatformUserId();

  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      currency: "USD",
    },
    select: { id: true },
  });

  return {
    userId,
    walletId: wallet.id,
  };
}
