import { createAuditLog } from "@/lib/audit/service";
import {
  applyRefundImpactToSellerGroups,
  createDisputeTimelineAndNotification,
  creditBuyerRefundInTx,
  getDisputeRefundCeiling,
  isWholeOrderDispute,
  replaceDisputeSellerGroupImpacts,
} from "@/lib/disputes/disputeService";
import { releaseEscrowPayoutInTx } from "@/lib/payout/releaseEscrowPayout";
import { buildFullRefundImpactMap } from "./disputeAction.utils";
import type { ResolveDisputeSharedParams } from "./disputeAction.types";

export async function resolveRefundBuyer(params: ResolveDisputeSharedParams) {
  const { tx, order, impactedGroupIds, activeDispute, adminId, actorRole, orderId } =
    params;

  const refundCeiling = getDisputeRefundCeiling(order, impactedGroupIds);
  const finalRefundAmount = isWholeOrderDispute(order, impactedGroupIds)
    ? order.totalAmount
    : refundCeiling;

  await creditBuyerRefundInTx(tx, {
    disputeId: activeDispute.id,
    orderId,
    buyerUserId: order.userId,
    amount: finalRefundAmount,
    referenceSuffix: "full",
  });

  const fullImpactMap = buildFullRefundImpactMap(order, impactedGroupIds);

  await replaceDisputeSellerGroupImpacts(
    tx,
    activeDispute.id,
    impactedGroupIds,
    fullImpactMap,
  );
  await applyRefundImpactToSellerGroups(tx, order, fullImpactMap);

  await tx.dispute.update({
    where: { id: activeDispute.id },
    data: {
      status: "RESOLVED",
      resolution: "REFUND_BUYER",
      refundAmount: finalRefundAmount,
      resolvedById: adminId,
    },
  });

  const wholeOrder = isWholeOrderDispute(order, impactedGroupIds);

  await tx.order.update({
    where: { id: orderId },
    data: {
      status: wholeOrder ? "REFUNDED" : "COMPLETED",
    },
  });

  if (!wholeOrder) {
    const payoutResult = await releaseEscrowPayoutInTx(tx, orderId, {
      allowDisputedOrder: true,
    });

    if ("skipped" in payoutResult && payoutResult.reason !== "PAYOUT_ALREADY_RELEASED") {
      throw new Error(
        `Unable to release remaining seller payout: ${payoutResult.reason}`,
      );
    }
  }

  await createDisputeTimelineAndNotification(tx, {
    orderId,
    userId: order.userId,
    title: "Refund issued",
    message: wholeOrder
      ? "Your dispute was resolved and a full refund has been issued."
      : "Your dispute was resolved and the affected items were refunded.",
    status: wholeOrder ? "REFUNDED" : "COMPLETED",
  });

  await createAuditLog(
    {
      actorId: adminId,
      actorRole,
      actionType: "DISPUTE_RESOLVED",
      targetEntityType: "DISPUTE",
      targetEntityId: activeDispute.id,
      summary: "Resolved dispute with buyer refund.",
      metadata: {
        orderId,
        resolution: "REFUND_BUYER",
        refundAmount: finalRefundAmount,
        finalOrderStatus: wholeOrder ? "REFUNDED" : "COMPLETED",
      },
    },
    tx,
  );

  return {
    success: true,
    nextStep: (wholeOrder ? "REFUNDED" : "COMPLETED") as
      | "REFUNDED"
      | "COMPLETED",
  };
}

