import { PrismaClient } from "@/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

function createPrismaClient() {
  const accelerateUrl = process.env.ACCELERATE_URL;
  const accelerateEnabled =
    process.env.PRISMA_ACCELERATE_ENABLED !== "false" && !!accelerateUrl;

  if (!accelerateEnabled) {
    return new PrismaClient();
  }

  return new PrismaClient({
    accelerateUrl,
  }).$extends(withAccelerate());
}

type PrismaInstance = ReturnType<typeof createPrismaClient>;
const globalForPrisma = globalThis as unknown as { prisma: PrismaInstance };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
