import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

async function resolvePlatformUserId(db: DbClient = prisma): Promise<string> {
  const explicitPlatformUserId = process.env.PLATFORM_ESCROW_USER_ID;
  if (explicitPlatformUserId) {
    const user = await db.user.findUnique({
      where: { id: explicitPlatformUserId },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "ADMIN") {
      throw new Error("PLATFORM_ESCROW_USER_ID must reference an ADMIN user.");
    }
    return user.id;
  }

  const admin = await db.user.findFirst({
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

export async function getOrCreateSystemEscrowAccount(
  db: DbClient = prisma,
) {
  const userId = await resolvePlatformUserId(db);

  const wallet = await db.wallet.upsert({
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
