import { prisma } from "@/lib/prisma";
import { finalizePostPayment } from "@/lib/payments/completeOrderPayment";
import { ServiceContext } from "@/lib/system/serviceContext";

const FINALIZE_ORDER_JOB_TYPE = "FINALIZE_ORDER";
const DEFAULT_JOB_BATCH_LIMIT = 10;
const DEFAULT_MAX_RETRIES = 5;
const BACKOFF_BASE_SECONDS = 30;

type FinalizeOrderJobPayload = {
  orderId: string;
};

function isFinalizeOrderPayload(
  payload: unknown,
): payload is FinalizeOrderJobPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return typeof candidate.orderId === "string";
}

export async function processPendingJobs(
  limit = DEFAULT_JOB_BATCH_LIMIT,
  context?: ServiceContext,
) {
  const now = new Date();
  const jobs = await prisma.job.findMany({
    where: {
      status: "PENDING",
      type: FINALIZE_ORDER_JOB_TYPE,
      runAt: { lte: now },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let processed = 0;

  for (const job of jobs) {
    if (processed >= limit) break;
    if (!isFinalizeOrderPayload(job.payload)) continue;

    const lock = await prisma.job.updateMany({
      where: {
        id: job.id,
        status: "PENDING",
        runAt: { lte: now },
      },
      data: {
        status: "PROCESSING",
      },
    });

    if (lock.count !== 1) continue;

    try {
      await finalizePostPayment(job.payload.orderId, context);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          lastError: null,
        },
      });
      processed += 1;
    } catch (error) {
      const nextAttempts = (job.attempts ?? 0) + 1;
      const maxRetries = job.maxRetries ?? DEFAULT_MAX_RETRIES;

      if (nextAttempts >= maxRetries) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            attempts: nextAttempts,
            lastError: error instanceof Error ? error.message : "Unknown error",
          },
        });
      } else {
        const retrySeconds = 2 ** nextAttempts * BACKOFF_BASE_SECONDS;
        const nextRunAt = new Date(Date.now() + retrySeconds * 1000);

        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "PENDING",
            attempts: nextAttempts,
            lastError: error instanceof Error ? error.message : "Unknown error",
            runAt: nextRunAt,
          },
        });
      }
    }
  }

  return { processed };
}
