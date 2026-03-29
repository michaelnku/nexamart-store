import { UserRole } from "@/generated/prisma/client";
import { createAuditLog } from "@/lib/audit/service";
import {
  applyRefundImpactToSellerGroups,
  createDisputeTimelineAndNotification,
  creditBuyerRefundInTx,
  ensureActiveDispute,
  getDisputeRefundCeiling,
  getOrderDisputeContext,
  isWholeOrderDispute,
  replaceDisputeSellerGroupImpacts,
} from "@/lib/disputes/disputeService";
import { buildFullRefundImpactMap } from "./disputeAction.utils";
import type { DisputeActionTx } from "./disputeAction.types";

export async function confirmReturnReceivedFlow({
  tx,
  orderId,
  adminId,
}: {
  tx: DisputeActionTx;
  orderId: string;
  adminId: string;
}) {
  const order = await getOrderDisputeContext(tx, orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const activeDispute = ensureActiveDispute(order);

  if (
    activeDispute.status !== "WAITING_FOR_RETURN" ||
    activeDispute.resolution !== "RETURN_AND_REFUND" ||
    !activeDispute.returnRequest
  ) {
    throw new Error("Return flow is not active for this dispute");
  }

  if (activeDispute.returnRequest.status !== "SHIPPED") {
    throw new Error("Return must be marked as shipped before confirmation");
  }

  const impactedGroupIds = activeDispute.disputeSellerGroupImpacts.length
    ? activeDispute.disputeSellerGroupImpacts.map((impact) => impact.sellerGroupId)
    : order.sellerGroups.map((group) => group.id);

  const refundAmount = getDisputeRefundCeiling(order, impactedGroupIds);
  const impactMap = buildFullRefundImpactMap(order, impactedGroupIds);

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
    referenceSuffix: "return",
  });

  await applyRefundImpactToSellerGroups(tx, order, impactMap);

  await tx.returnRequest.update({
    where: { disputeId: activeDispute.id },
    data: {
      status: "RECEIVED",
      receivedAt: new Date(),
    },
  });

  await tx.dispute.update({
    where: { id: activeDispute.id },
    data: {
      status: "RESOLVED",
      resolution: "RETURN_AND_REFUND",
      refundAmount,
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

  await createDisputeTimelineAndNotification(tx, {
    orderId,
    userId: order.userId,
    title: "Return confirmed",
    message: wholeOrder
      ? "Return confirmed and refund issued."
      : "Returned items were confirmed and the refund was issued.",
    status: wholeOrder ? "REFUNDED" : "COMPLETED",
  });

  await createAuditLog(
    {
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      actionType: "DISPUTE_RETURN_CONFIRMED",
      targetEntityType: "DISPUTE",
      targetEntityId: activeDispute.id,
      summary: "Confirmed returned items and completed the dispute refund.",
      metadata: {
        orderId,
        refundAmount,
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
