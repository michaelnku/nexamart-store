import { prisma } from "@/lib/prisma";
import { acquireCronLock, releaseCronLock } from "@/lib/cron/cronLock";

const LOCK_NAME = "ESCROW_SNAPSHOT_DAILY";

export async function createDailyEscrowSnapshot() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) return { skipped: true };

  try {
    const held = await prisma.escrowLedger.aggregate({
      _sum: { amount: true },
      where: { status: "HELD" },
    });

    await prisma.escrowSnapshot.create({
      data: {
        totalHeld: held._sum.amount ?? 0,
      },
    });

    return { skipped: false };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}

export async function generateEscrowSnapshot() {
  return createDailyEscrowSnapshot();
}
