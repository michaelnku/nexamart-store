import { createAuditLog } from "@/lib/audit/service";
import {
  applyRefundImpactToSellerGroups,
  createDisputeTimelineAndNotification,
  creditBuyerRefundInTx,
  getDisputeRefundCeiling,
  normalizeSellerGroupRefundImpacts,
  replaceDisputeSellerGroupImpacts,
  type SellerGroupImpactInput,
} from "@/lib/disputes/disputeService";
import { releaseEscrowPayoutInTx } from "@/lib/payout/releaseEscrowPayout";
import type { ResolveDisputeSharedParams } from "./disputeAction.types";

export async function resolvePartialRefund({
  params,
  refundAmount,
  sellerGroupImpacts,
}: {
  params: ResolveDisputeSharedParams;
  refundAmount?: number;
  sellerGroupImpacts?: SellerGroupImpactInput[];
}) {
  const {
    tx,
    order,
    impactedGroupIds,
    activeDispute,
    adminId,
    actorRole,
    orderId,
    policy,
  } = params;

  if (!refundAmount) {
    throw new Error("Partial refund amount is required");
  }

  const refundCeiling = getDisputeRefundCeiling(order, impactedGroupIds);

  if (refundAmount > refundCeiling) {
    throw new Error("Partial refund exceeds the refundable amount");
  }

  const impactMap = normalizeSellerGroupRefundImpacts(
    order,
    refundAmount,
    sellerGroupImpacts,
  );

  await replaceDisputeSellerGroupImpacts(
    tx,
    activeDispute.id,
    impactedGroupIds,
    impactMap,
  );

  await creditBuyerRefundInTx(tx, {
    disputeId: activeDispute.id,
    orderId,
    buyerUserId: order.userId,
    amount: refundAmount,
    referenceSuffix: "partial",
  });

  const fullyRefundedGroupIds = await applyRefundImpactToSellerGroups(
    tx,
    order,
    impactMap,
  );

  const releasableGroupIds = impactedGroupIds.filter(
    (groupId) => !fullyRefundedGroupIds.includes(groupId),
  );

  if (releasableGroupIds.length > 0) {
    await tx.orderSellerGroup.updateMany({
      where: { id: { in: releasableGroupIds } },
      data: { payoutLocked: false },
    });
  }

  if (policy.lockRiderPayout) {
    await tx.delivery.updateMany({
      where: { orderId },
      data: { payoutLocked: false },
    });
  }

  const payoutResult = await releaseEscrowPayoutInTx(tx, orderId, {
    allowDisputedOrder: true,
  });

  if ("skipped" in payoutResult && payoutResult.reason !== "PAYOUT_ALREADY_RELEASED") {
    throw new Error(
      `Unable to release adjusted seller payout: ${payoutResult.reason}`,
    );
  }

  await tx.dispute.update({
    where: { id: activeDispute.id },
    data: {
      status: "RESOLVED",
      resolution: "PARTIAL_REFUND",
      refundAmount,
      resolvedById: adminId,
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
    title: "Partial refund issued",
    message: "Your dispute was resolved and a partial refund has been issued.",
    status: "COMPLETED",
  });

  await createAuditLog(
    {
      actorId: adminId,
      actorRole,
      actionType: "DISPUTE_RESOLVED",
      targetEntityType: "DISPUTE",
      targetEntityId: activeDispute.id,
      summary: "Resolved dispute with partial refund.",
      metadata: {
        orderId,
        resolution: "PARTIAL_REFUND",
        refundAmount,
        finalOrderStatus: "COMPLETED",
      },
    },
    tx,
  );

  return { success: true, nextStep: "COMPLETED" as const };
}

