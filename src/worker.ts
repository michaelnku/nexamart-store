import { prisma } from "@/lib/prisma";
import { finalizePostPayment } from "@/lib/payments/completeOrderPayment";
import { ServiceContext } from "@/lib/system/serviceContext";
import { markSellerGroupReady } from "@/lib/order/markSellerGroupReady";

const FINALIZE_ORDER_JOB_TYPE = "FINALIZE_ORDER";
const MARK_READY_JOB_TYPE = "MARK_READY";
const LEGACY_MARK_SELLER_GROUP_READY_JOB_TYPE = "MARK_SELLER_GROUP_READY";
const DEFAULT_JOB_BATCH_LIMIT = 20;
const DEFAULT_MAX_RETRIES = 5;
const BACKOFF_BASE_SECONDS = 30;

type FinalizeOrderJobPayload = {
  orderId: string;
};
type MarkSellerGroupReadyJobPayload = {
  sellerGroupId: string;
};

function isFinalizeOrderPayload(
  payload: unknown,
): payload is FinalizeOrderJobPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return typeof candidate.orderId === "string";
}

function isMarkSellerGroupReadyPayload(
  payload: unknown,
): payload is MarkSellerGroupReadyJobPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return typeof candidate.sellerGroupId === "string";
}

export async function processPendingJobs(
  limit = DEFAULT_JOB_BATCH_LIMIT,
  context?: ServiceContext,
) {
  const now = new Date();
  const jobs = await prisma.job.findMany({
    where: {
      status: "PENDING",
      type: {
        in: [
          FINALIZE_ORDER_JOB_TYPE,
          MARK_READY_JOB_TYPE,
          LEGACY_MARK_SELLER_GROUP_READY_JOB_TYPE,
        ],
      },
      runAt: { lte: now },
    },
    orderBy: [{ runAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  let processed = 0;

  for (const job of jobs) {
    if (processed >= limit) break;

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
      if (
        job.type === FINALIZE_ORDER_JOB_TYPE &&
        isFinalizeOrderPayload(job.payload)
      ) {
        await finalizePostPayment(job.payload.orderId, context);
      } else if (
        (job.type === MARK_READY_JOB_TYPE ||
          job.type === LEGACY_MARK_SELLER_GROUP_READY_JOB_TYPE) &&
        isMarkSellerGroupReadyPayload(job.payload)
      ) {
        await markSellerGroupReady(job.payload.sellerGroupId, "AUTO");
      } else {
        throw new Error("Invalid job payload");
      }

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
