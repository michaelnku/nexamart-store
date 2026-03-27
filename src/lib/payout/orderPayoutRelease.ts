import { Prisma } from "@/generated/prisma";
import { DisputeStatus } from "@/generated/prisma/client";
import { isTerminalDisputeStatus } from "@/lib/disputes/policy";
import {
  RELEASE_ORDER_PAYOUT_JOB_TYPE,
  buildReleaseOrderPayoutJobId,
} from "@/lib/jobs/jobTypes";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { releaseEscrowPayoutInTx } from "@/lib/payout/releaseEscrowPayout";
import {
  isDeliveryRiderPayoutPending,
  releaseRiderDeliveryPayoutInTx,
} from "@/lib/payout/riderPayouts";
import { syncOrderPayoutReleasedStateInTx } from "@/lib/payout/sellerPayouts";
import { getPayoutEligibleAtFrom } from "@/lib/payout/timing";
import { prisma } from "@/lib/prisma";
import { createServiceContext } from "@/lib/system/serviceContext";

type Tx = Prisma.TransactionClient;

const PAYOUT_RELEASE_RECHECK_MS = 30 * 60 * 1000;

export type OrderPayoutReleaseJobPayload = {
  orderId: string;
  releaseAt: string;
};

export type OrderPayoutReleaseJobOutcome =
  | { status: "COMPLETED"; reason: string }
  | { status: "DEFERRED"; reason: string; runAt: Date };

export function isOrderPayoutReleasePayload(
  payload: unknown,
): payload is OrderPayoutReleaseJobPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.orderId === "string" &&
    typeof candidate.releaseAt === "string"
  );
}

function nextPayoutRecheckAt(now: Date): Date {
  return new Date(now.getTime() + PAYOUT_RELEASE_RECHECK_MS);
}

function isPayoutBlockedByDispute(disputeStatus?: DisputeStatus | null) {
  if (!disputeStatus) return true;
  return !isTerminalDisputeStatus(disputeStatus);
}

export async function ensureOrderPayoutReleaseJobInTx(
  tx: Tx,
  input: {
    orderId: string;
    releaseAt: Date;
  },
): Promise<void> {
  const jobId = buildReleaseOrderPayoutJobId(input.orderId);

  // UptimeRobot wakes `/api/cron/process` every 5 minutes. That route calls
  // `processPendingJobs(...)`, so scheduling this job is what makes payout
  // release happen later without a second payout cron trigger.
  await tx.job.upsert({
    where: { id: jobId },
    update: {
      type: RELEASE_ORDER_PAYOUT_JOB_TYPE,
      status: "PENDING",
      runAt: input.releaseAt,
      attempts: 0,
      lastError: null,
      maxRetries: 5,
      payload: {
        orderId: input.orderId,
        releaseAt: input.releaseAt.toISOString(),
      },
    },
    create: {
      id: jobId,
      type: RELEASE_ORDER_PAYOUT_JOB_TYPE,
      status: "PENDING",
      runAt: input.releaseAt,
      attempts: 0,
      lastError: null,
      maxRetries: 5,
      payload: {
        orderId: input.orderId,
        releaseAt: input.releaseAt.toISOString(),
      },
    },
  });
}

export async function releaseOrderPayoutsInTx(
  tx: Tx,
  input: {
    orderId: string;
    now: Date;
  },
): Promise<OrderPayoutReleaseJobOutcome> {
  const order = await tx.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      status: true,
      isPaid: true,
      payoutReleased: true,
      isFoodOrder: true,
      dispute: {
        select: {
          status: true,
        },
      },
      delivery: {
        select: {
          id: true,
          riderId: true,
          riderPayoutAmount: true,
          status: true,
          deliveredAt: true,
          payoutEligibleAt: true,
          payoutReleasedAt: true,
        },
      },
    },
  });

  if (!order) return { status: "COMPLETED", reason: "ORDER_NOT_FOUND" };
  if (!order.isPaid) return { status: "COMPLETED", reason: "ORDER_NOT_PAID" };
  if (order.status === "COMPLETED") {
    return { status: "COMPLETED", reason: "PAYOUT_ALREADY_RELEASED" };
  }
  if (order.status !== "DELIVERED") {
    return { status: "COMPLETED", reason: "ORDER_NOT_DELIVERED" };
  }
  if (
    !order.delivery ||
    order.delivery.status !== "DELIVERED" ||
    !order.delivery.deliveredAt
  ) {
    return { status: "COMPLETED", reason: "DELIVERY_NOT_CONFIRMED" };
  }

  const releaseAt =
    order.delivery.payoutEligibleAt ??
    getPayoutEligibleAtFrom(order.delivery.deliveredAt, order.isFoodOrder);

  if (releaseAt > input.now) {
    return {
      status: "DEFERRED",
      reason: "DISPUTE_WINDOW_NOT_ELAPSED",
      runAt: releaseAt,
    };
  }

  if (
    order.dispute &&
    isPayoutBlockedByDispute(order.dispute?.status ?? null)
  ) {
    return {
      status: "DEFERRED",
      reason: "ACTIVE_DISPUTE_LOCKED",
      runAt: nextPayoutRecheckAt(input.now),
    };
  }

  const sellerContext = createServiceContext("SELLER_PAYOUT_CRON");
  const riderContext = createServiceContext("RIDER_PAYOUT_CRON");
  const systemEscrowAccount = await getOrCreateSystemEscrowAccount(tx);

  const sellerReleaseResult = await releaseEscrowPayoutInTx(tx, order.id, {
    context: sellerContext,
    systemEscrowAccount,
  });

  if (
    "skipped" in sellerReleaseResult &&
    !["PAYOUT_ALREADY_RELEASED", "NO_GROUPS_RELEASED"].includes(
      sellerReleaseResult.reason,
    )
  ) {
    if (
      sellerReleaseResult.reason === "ACTIVE_DISPUTE_LOCKED" ||
      sellerReleaseResult.reason === "SELLER_GROUP_LOCKED"
    ) {
      return {
        status: "DEFERRED",
        reason: sellerReleaseResult.reason,
        runAt: nextPayoutRecheckAt(input.now),
      };
    }

    return { status: "COMPLETED", reason: sellerReleaseResult.reason };
  }

  if (isDeliveryRiderPayoutPending(order.delivery)) {
    const riderReleaseResult = await releaseRiderDeliveryPayoutInTx(
      tx,
      order.delivery.id,
      systemEscrowAccount,
      input.now,
      riderContext,
    );

    if (
      "skipped" in riderReleaseResult &&
      riderReleaseResult.reason !== "PAYOUT_ALREADY_RELEASED"
    ) {
      if (riderReleaseResult.reason === "ACTIVE_DISPUTE_LOCKED") {
        return {
          status: "DEFERRED",
          reason: riderReleaseResult.reason,
          runAt: nextPayoutRecheckAt(input.now),
        };
      }

      if (riderReleaseResult.reason === "DELIVERY_LOCK_UNAVAILABLE") {
        return {
          status: "DEFERRED",
          reason: riderReleaseResult.reason,
          runAt: nextPayoutRecheckAt(input.now),
        };
      }

      return { status: "COMPLETED", reason: riderReleaseResult.reason };
    }
  }

  await syncOrderPayoutReleasedStateInTx(tx, order.id);

  const payoutState = await tx.order.findUnique({
    where: { id: order.id },
    select: {
      status: true,
      payoutReleased: true,
    },
  });

  if (payoutState?.payoutReleased) {
    await tx.order.updateMany({
      where: {
        id: order.id,
        status: "DELIVERED",
        payoutReleased: true,
      },
      data: {
        status: "COMPLETED",
      },
    });

    await createOrderTimelineIfMissing(
      {
        orderId: order.id,
        status: "COMPLETED",
        message: "Payout released successfully. Order completed.",
      },
      tx,
    );
  }

  if (!payoutState?.payoutReleased) {
    return {
      status: "DEFERRED",
      reason: "PAYOUT_RELEASE_NOT_READY",
      runAt: nextPayoutRecheckAt(input.now),
    };
  }

  return {
    status: "COMPLETED",
    reason: "PAYOUT_RELEASED",
  };
}

export async function processOrderPayoutReleaseJob(
  jobId: string,
  payload: OrderPayoutReleaseJobPayload,
): Promise<OrderPayoutReleaseJobOutcome> {
  const now = new Date();

  const outcome = await prisma.$transaction((tx) =>
    releaseOrderPayoutsInTx(tx, {
      orderId: payload.orderId,
      now,
    }),
  );

  if (outcome.status === "DEFERRED") {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        runAt: outcome.runAt,
        attempts: 0,
        lastError: null,
        payload: {
          orderId: payload.orderId,
          releaseAt: outcome.runAt.toISOString(),
        },
      },
    });
  }

  return outcome;
}
