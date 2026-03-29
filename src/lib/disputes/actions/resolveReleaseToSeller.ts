import { createAuditLog } from "@/lib/audit/service";
import {
  createDisputeTimelineAndNotification,
  setDisputePayoutLocks,
} from "@/lib/disputes/disputeService";
import { releaseEscrowPayoutInTx } from "@/lib/payout/releaseEscrowPayout";
import type { ResolveDisputeSharedParams } from "./disputeAction.types";

export async function resolveReleaseToSeller(
  params: ResolveDisputeSharedParams,
) {
  const {
    tx,
    activeDispute,
    policy,
    impactedGroupIds,
    orderId,
    order,
    adminId,
    actorRole,
  } = params;

  await setDisputePayoutLocks(tx, {
    orderId,
    sellerGroupIds: impactedGroupIds,
    locked: false,
    lockRider: policy.lockRiderPayout,
  });

  const payoutResult = await releaseEscrowPayoutInTx(tx, orderId, {
    allowDisputedOrder: true,
  });

  if ("skipped" in payoutResult && payoutResult.reason !== "PAYOUT_ALREADY_RELEASED") {
    throw new Error(`Unable to release seller payout: ${payoutResult.reason}`);
  }

  await tx.dispute.update({
    where: { id: activeDispute.id },
    data: {
      status: "RESOLVED",
      resolution: "RELEASE_TO_SELLER",
      resolvedById: adminId,
      refundAmount: null,
    },
  });

  await tx.order.update({
    where: { id: orderId },
    data: {
      status: "COMPLETED",
    },
  });

  await createDisputeTimelineAndNotification(tx, {
    orderId,
    userId: order.userId,
    title: "Dispute resolved",
    message: "The dispute was resolved in favor of the seller.",
    status: "COMPLETED",
  });

  await createAuditLog(
    {
      actorId: adminId,
      actorRole,
      actionType: "DISPUTE_RESOLVED",
      targetEntityType: "DISPUTE",
      targetEntityId: activeDispute.id,
      summary: "Resolved dispute in favor of the seller.",
      metadata: {
        orderId,
        resolution: "RELEASE_TO_SELLER",
        disputeStatus: "RESOLVED",
      },
    },
    tx,
  );

  return { success: true, nextStep: "COMPLETED" as const };
}

