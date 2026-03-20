import "dotenv/config";

import { UserRole, WalletStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const TREASURY_DISPLAY_NAME = "NexaMart Treasury";

async function main() {
  const email = process.env.PLATFORM_ESCROW_USER_EMAIL?.trim();

  if (!email) {
    throw new Error("PLATFORM_ESCROW_USER_EMAIL is not set");
  }

  const now = new Date();

  const treasuryUser = await prisma.user.upsert({
    where: { email },
    update: {
      name: TREASURY_DISPLAY_NAME,
      role: UserRole.SYSTEM,
      isSystemUser: true,
      password: null,
      isBanned: false,
      isDeleted: false,
      deletedAt: null,
      scheduledDeletionAt: null,
      emailVerified: now,
    },
    create: {
      email,
      name: TREASURY_DISPLAY_NAME,
      role: UserRole.SYSTEM,
      isSystemUser: true,
      password: null,
      isBanned: false,
      isDeleted: false,
      emailVerified: now,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isSystemUser: true,
    },
  });

  const treasuryWallet = await prisma.wallet.upsert({
    where: { userId: treasuryUser.id },
    update: {
      status: WalletStatus.ACTIVE,
      currency: "USD",
    },
    create: {
      userId: treasuryUser.id,
      status: WalletStatus.ACTIVE,
      currency: "USD",
      balance: 0,
      pending: 0,
      totalEarnings: 0,
    },
    select: {
      id: true,
      userId: true,
      status: true,
      currency: true,
    },
  });

  console.log(
    `Treasury system user ready: ${treasuryUser.email} (${treasuryUser.id}) role=${treasuryUser.role} isSystemUser=${treasuryUser.isSystemUser}`,
  );
  console.log(
    `Treasury wallet ready: ${treasuryWallet.id} userId=${treasuryWallet.userId} status=${treasuryWallet.status} currency=${treasuryWallet.currency}`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
