import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type PlatformTreasuryAccount = {
  userId: string;
  walletId: string;
};

type TreasuryResolutionOptions = {
  requireConfigured?: boolean;
};

async function resolvePlatformTreasuryUserId(
  db: DbClient = prisma,
  options: TreasuryResolutionOptions = {},
): Promise<string> {
  const requireConfigured =
    options.requireConfigured ?? process.env.NODE_ENV === "production";
  const explicitPlatformUserId = process.env.PLATFORM_ESCROW_USER_ID?.trim();

  if (explicitPlatformUserId) {
    const user = await db.user.findUnique({
      where: { id: explicitPlatformUserId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "SYSTEM") {
      throw new Error(
        "PLATFORM_ESCROW_USER_ID must reference the dedicated SYSTEM treasury user.",
      );
    }

    return user.id;
  }

  if (requireConfigured) {
    throw new Error(
      "PLATFORM_ESCROW_USER_ID must be configured for treasury-backed escrow flows.",
    );
  }

  // Development fallback only. Production flows must pin the dedicated SYSTEM
  // treasury identity so escrow funding and payout release always use one wallet.
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

export async function getOrCreateSystemEscrowWallet(
  db: DbClient = prisma,
  options: TreasuryResolutionOptions = {},
) {
  const account = await getOrCreateSystemEscrowAccount(db, options);
  return account.walletId;
}

export async function getOrCreateSystemEscrowAccount(
  db: DbClient = prisma,
  options: TreasuryResolutionOptions = {},
): Promise<PlatformTreasuryAccount> {
  const userId = await resolvePlatformTreasuryUserId(db, options);

  // The platform treasury wallet holds customer-funded escrow until seller and
  // rider payouts are released. All treasury-backed release paths must use it.
  const wallet = await db.wallet.upsert({
    where: { userId },
    update: {
      status: "ACTIVE",
      currency: "USD",
    },
    create: {
      userId,
      currency: "USD",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return {
    userId,
    walletId: wallet.id,
  };
}
