import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORM_ESCROW_USER_EMAIL_ENV = "PLATFORM_ESCROW_USER_EMAIL";
const TREASURY_DISPLAY_NAME = "NexaMart Treasury";

function getPlatformEscrowUserEmail() {
  const email = process.env[PLATFORM_ESCROW_USER_EMAIL_ENV]?.trim();

  if (!email) {
    throw new Error(
      `Missing ${PLATFORM_ESCROW_USER_EMAIL_ENV} before running treasury seed.`,
    );
  }

  return email;
}

async function seedTreasurySystemUser() {
  const email = getPlatformEscrowUserEmail();
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: TREASURY_DISPLAY_NAME,
      role: "SYSTEM",
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
      role: "SYSTEM",
      isSystemUser: true,
      password: null,
      emailVerified: now,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isSystemUser: true,
    },
  });

  console.log(
    `Treasury system user ready: ${user.email} (${user.id}) role=${user.role} isSystemUser=${user.isSystemUser}`,
  );
}

seedTreasurySystemUser()
  .catch((error) => {
    console.error("Failed to seed treasury system user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
