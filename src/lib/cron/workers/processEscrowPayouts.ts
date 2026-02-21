import { acquireCronLock, releaseCronLock } from "@/lib/cron/workers/cronLock";
import { prisma } from "@/lib/prisma";
import { releaseEscrowPayout } from "@/lib/payout/releaseEscrowPayout";

const LOCK_NAME = "PROCESS_ESCROW_PAYOUTS";
const BATCH_SIZE = 20;

type EscrowPayload = {
  orderId: string;
  releaseAt: string;
};

function isEscrowPayload(payload: unknown): payload is EscrowPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.orderId === "string" &&
    typeof candidate.releaseAt === "string"
  );
}

export async function processEscrowPayouts() {
  const hasLock = await acquireCronLock(LOCK_NAME);
  if (!hasLock) return { skipped: true, processed: 0 };

  try {
    const now = new Date();

    const jobs = await prisma.job.findMany({
      where: {
        type: "RELEASE_ESCROW_PAYOUT",
        status: "PENDING",
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    let processed = 0;

    for (const job of jobs) {
      if (!isEscrowPayload(job.payload)) continue;

      const releaseAt = new Date(job.payload.releaseAt);
      if (Number.isNaN(releaseAt.getTime()) || releaseAt > now) continue;

      const result = await releaseEscrowPayout(job.payload.orderId);

      if ("success" in result) {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "DONE" },
        });
      } else if (
        "skipped" in result &&
        result.reason !== "PAYOUT_SKIPPED_ACTIVE_DISPUTE"
      ) {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "DONE" },
        });
      }

      processed++;
    }

    return { skipped: false, processed };
  } finally {
    await releaseCronLock(LOCK_NAME);
  }
}
