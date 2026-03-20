import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import "dotenv/config";

async function main() {
  const email = process.env.PLATFORM_ESCROW_USER_EMAIL;

  if (!email) {
    throw new Error("PLATFORM_ESCROW_USER_EMAIL is not set");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.SYSTEM,
      isSystemUser: true,
      isDeleted: false,
      deletedAt: null,
    },
    create: {
      email,
      name: "NexaMart System",
      role: UserRole.SYSTEM,
      isSystemUser: true,
    },
  });

  console.log("System treasury user ready:", user.id);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
