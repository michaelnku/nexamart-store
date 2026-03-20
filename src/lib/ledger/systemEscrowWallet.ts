import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;
type TreasurySystemUser = {
  id: string;
  email: string;
  isSystemUser: boolean;
};

export type PlatformTreasuryAccount = {
  userId: string;
  walletId: string;
};

const PLATFORM_ESCROW_USER_EMAIL_ENV = "PLATFORM_ESCROW_USER_EMAIL";

function getConfiguredPlatformEscrowUserEmail(): string {
  const configuredEmail =
    process.env[PLATFORM_ESCROW_USER_EMAIL_ENV]?.trim();

  if (!configuredEmail) {
    throw new Error(
      `Missing ${PLATFORM_ESCROW_USER_EMAIL_ENV} for treasury-backed wallet flows.`,
    );
  }

  return configuredEmail;
}

export async function resolvePlatformEscrowSystemUser(
  db: DbClient = prisma,
): Promise<TreasurySystemUser> {
  const email = getConfiguredPlatformEscrowUserEmail();
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isSystemUser: true,
    },
  });

  if (!user) {
    throw new Error(
      `Platform treasury user was not found for ${PLATFORM_ESCROW_USER_EMAIL_ENV}. Seed the treasury system user before running wallet or escrow flows.`,
    );
  }

  if (!user.isSystemUser) {
    throw new Error(
      `Platform treasury user for ${PLATFORM_ESCROW_USER_EMAIL_ENV} must have isSystemUser=true.`,
    );
  }

  return user;
}

export async function getOrCreateSystemEscrowWallet(db: DbClient = prisma) {
  const account = await getOrCreateSystemEscrowAccount(db);
  return account.walletId;
}

export async function getOrCreateSystemEscrowAccount(
  db: DbClient = prisma,
): Promise<PlatformTreasuryAccount> {
  const systemUser = await resolvePlatformEscrowSystemUser(db);

  // The platform treasury wallet holds customer-funded escrow until seller and
  // rider payouts are released. All treasury-backed release paths must use it.
  const wallet = await db.wallet.upsert({
    where: { userId: systemUser.id },
    update: {
      status: "ACTIVE",
      currency: "USD",
    },
    create: {
      userId: systemUser.id,
      currency: "USD",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return {
    userId: systemUser.id,
    walletId: wallet.id,
  };
}
