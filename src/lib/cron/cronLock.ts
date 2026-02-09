import { prisma } from "@/lib/prisma";

const LOCK_TIMEOUT_MS = 10 * 60 * 1000;

export async function acquireCronLock(name: string) {
  const now = new Date();

  try {
    await prisma.cronLock.create({
      data: {
        name,
        lockedAt: now,
      },
    });

    return true;
  } catch {
    const existing = await prisma.cronLock.findUnique({
      where: { name },
    });

    if (!existing) return false;

    const isExpired =
      now.getTime() - existing.lockedAt.getTime() > LOCK_TIMEOUT_MS;

    if (!isExpired) {
      return false;
    }

    await prisma.cronLock.update({
      where: { name },
      data: { lockedAt: now },
    });

    return true;
  }
}

export async function releaseCronLock(name: string) {
  await prisma.cronLock.delete({
    where: { name },
  });
}
