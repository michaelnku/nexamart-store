"use server";

import { UserRole } from "@/generated/prisma/client";
import { createAuditLog } from "@/lib/audit/service";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import {
  applyRefundImpactToSellerGroups,
  createAdminNotifications,
  createDisputeTimelineAndNotification,
  creditBuyerRefundInTx,
  ensureActiveDispute,
  ensureDisputeCanBeOpened,
  getDisputeRefundCeiling,
  getOrderDisputeContext,
  isWholeOrderDispute,
  normalizeSellerGroupRefundImpacts,
  openReturnRequestInTx,
  replaceDisputeSellerGroupImpacts,
  resolveImpactedSellerGroupIds,
  setDisputePayoutLocks,
  type OrderDisputeContext,
  type SellerGroupImpactInput,
} from "@/lib/disputes/disputeService";
import {
  createDisputeEvidenceInTx,
  snapshotExistingDeliveryEvidenceForDisputeInTx,
} from "@/lib/evidence/service";
import {
  getDisputePolicy,
  isResolutionAllowed,
  normalizeDisputeResolution,
  parseDisputeReason,
} from "@/lib/disputes/policy";
import { parseDisputeOpenEvidenceFiles } from "@/lib/evidence/validation";
import { releaseEscrowPayoutInTx } from "@/lib/payout/releaseEscrowPayout";

function buildFullRefundImpactMap(
  order: OrderDisputeContext,
  impactedGroupIds: string[],
): Map<string, number> {
  const groups = order.sellerGroups.filter((group) => impactedGroupIds.includes(group.id));

  return new Map(
    groups.map((group) => [
      group.id,
      Number((group.subtotal + Math.max(0, group.shippingFee)).toFixed(2)),
    ]),
  );
}

export async function raiseOrderDisputeAction(
  orderId: string,
  reasonInput: string,
  description?: string,
  sellerGroupIds?: string[],
  evidenceFiles?: Array<{
    fileUrl: string;
    fileKey?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    caption?: string | null;
    metadata?: Record<string, unknown> | null;
  }>,
) {
  const userId = await CurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const parsedReason = parseDisputeReason(reasonInput);
  const reason = parsedReason ?? "OTHER";
  const cleanDescription =
    (description ?? (parsedReason ? "" : reasonInput)).trim() || null;
  const parsedEvidenceFiles = parseDisputeOpenEvidenceFiles(evidenceFiles);

  return prisma.$transaction(async (tx) => {
    const order = await getOrderDisputeContext(tx, orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    ensureDisputeCanBeOpened(order, userId, reason);

    const impactedGroupIds = resolveImpactedSellerGroupIds(order, sellerGroupIds);
    const policy = getDisputePolicy(order.isFoodOrder, reason);

    const dispute = await tx.dispute.create({
      data: {
        orderId,
        openedById: userId,
        reason,
        description: cleanDescription,
        status: "OPEN",
      },
    });

    await snapshotExistingDeliveryEvidenceForDisputeInTx(
      tx,
      { userId, role: "USER" },
      dispute.id,
    );

    for (const file of parsedEvidenceFiles) {
      await createDisputeEvidenceInTx(tx, { userId, role: "USER" }, {
        disputeId: dispute.id,
        visibility: "PARTIES_AND_ADMIN",
        isInternal: false,
        file,
      });
    }

    await replaceDisputeSellerGroupImpacts(tx, dispute.id, impactedGroupIds);

    await setDisputePayoutLocks(tx, {
      orderId,
      sellerGroupIds: impactedGroupIds,
      locked: true,
      lockRider: policy.lockRiderPayout,
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "DISPUTED",
      },
    });

    await createDisputeTimelineAndNotification(tx, {
      orderId,
      userId,
      title: "Dispute opened",
      message: "Your dispute has been opened and is now under review.",
      status: "DISPUTED",
    });

    await createAdminNotifications(
      tx,
      "New dispute",
      `A new dispute was opened for order ${orderId}.`,
    );

    return { success: true, disputeId: dispute.id };
  });
}

function ensureAdmin(role: string | null, adminId: string | null): asserts adminId is string {
  if (role !== "ADMIN" || !adminId) {
    throw new Error("Forbidden");
  }
}

export async function resolveOrderDisputeAction(
  orderId: string,
  resolutionInput: string,
  refundAmount?: number,
  sellerGroupImpacts?: SellerGroupImpactInput[],
) {
  const [role, adminId] = await Promise.all([CurrentRole(), CurrentUserId()]);
  ensureAdmin(role, adminId);

  const resolution = normalizeDisputeResolution(resolutionInput);

  return prisma.$transaction(async (tx) => {
    const order = await getOrderDisputeContext(tx, orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const activeDispute = ensureActiveDispute(order);
    const policy = getDisputePolicy(order.isFoodOrder, activeDispute.reason);

    if (!isResolutionAllowed(policy, resolution)) {
      throw new Error("Resolution is not allowed for this dispute");
    }

    const impactedGroupIds = activeDispute.disputeSellerGroupImpacts.length
      ? activeDispute.disputeSellerGroupImpacts.map((impact) => impact.sellerGroupId)
      : order.sellerGroups.map((group) => group.id);

    if (resolution === "RETURN_AND_REFUND") {
      if (!policy.requiresReturn) {
        throw new Error("This dispute does not require a return flow");
      }

      await openReturnRequestInTx(tx, activeDispute.id);

      await tx.dispute.update({
        where: { id: activeDispute.id },
        data: {
          status: "WAITING_FOR_RETURN",
          resolution: "RETURN_AND_REFUND",
          resolvedById: adminId,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "RETURN_REQUESTED" },
      });

      await createDisputeTimelineAndNotification(tx, {
        orderId,
        userId: order.userId,
        title: "Return requested",
        message:
          "Return instructions have been issued. Refund will be processed after the return is confirmed.",
        status: "RETURN_REQUESTED",
      });

      await createAuditLog(
        {
          actorId: adminId,
          actorRole: UserRole.ADMIN,
          actionType: "DISPUTE_RESOLVED",
          targetEntityType: "DISPUTE",
          targetEntityId: activeDispute.id,
          summary: "Resolved dispute into return-and-refund flow.",
          metadata: {
            orderId,
            resolution: "RETURN_AND_REFUND",
            disputeStatus: "WAITING_FOR_RETURN",
          },
        },
        tx,
      );

      return { success: true, nextStep: "RETURN_REQUESTED" };
    }

    if (policy.requiresReturn) {
      throw new Error("This dispute requires a return flow before refund resolution");
    }

    if (resolution === "RELEASE_TO_SELLER") {
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
          actorRole: UserRole.ADMIN,
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

      return { success: true, nextStep: "COMPLETED" };
    }

    if (resolution === "REFUND_BUYER") {
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

      await replaceDisputeSellerGroupImpacts(tx, activeDispute.id, impactedGroupIds, fullImpactMap);
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
          throw new Error(`Unable to release remaining seller payout: ${payoutResult.reason}`);
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
          actorRole: UserRole.ADMIN,
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

      return { success: true, nextStep: wholeOrder ? "REFUNDED" : "COMPLETED" };
    }

    if (resolution === "PARTIAL_REFUND") {
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

      await replaceDisputeSellerGroupImpacts(tx, activeDispute.id, impactedGroupIds, impactMap);

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
        throw new Error(`Unable to release adjusted seller payout: ${payoutResult.reason}`);
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
          actorRole: UserRole.ADMIN,
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

      return { success: true, nextStep: "COMPLETED" };
    }

    throw new Error("Unsupported dispute resolution");
  });
}

export async function markReturnShippedAction(
  orderId: string,
  trackingNumber: string,
  carrier?: string,
) {
  const userId = await CurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const cleanTrackingNumber = trackingNumber.trim();
  if (!cleanTrackingNumber) {
    throw new Error("Tracking number is required");
  }

  return prisma.$transaction(async (tx) => {
    const order = await getOrderDisputeContext(tx, orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.userId !== userId) {
      throw new Error("Forbidden");
    }

    const activeDispute = ensureActiveDispute(order);

    if (
      activeDispute.status !== "WAITING_FOR_RETURN" ||
      !activeDispute.returnRequest
    ) {
      throw new Error("Return request is not active");
    }

    await tx.returnRequest.update({
      where: { disputeId: activeDispute.id },
      data: {
        status: "SHIPPED",
        trackingNumber: cleanTrackingNumber,
        carrier: carrier?.trim() || null,
        shippedAt: new Date(),
      },
    });

    await tx.dispute.update({
      where: { id: activeDispute.id },
      data: { status: "WAITING_FOR_RETURN" },
    });

    await createDisputeTimelineAndNotification(tx, {
      orderId,
      userId,
      title: "Return shipped",
      message: "Your return shipment details were submitted successfully.",
      status: "RETURN_REQUESTED",
    });

    return { success: true };
  });
}

export async function confirmReturnReceivedAction(orderId: string) {
  const [role, adminId] = await Promise.all([CurrentRole(), CurrentUserId()]);
  ensureAdmin(role, adminId);

  return prisma.$transaction(async (tx) => {
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

    await replaceDisputeSellerGroupImpacts(tx, activeDispute.id, impactedGroupIds, impactMap);
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

    return { success: true, nextStep: wholeOrder ? "REFUNDED" : "COMPLETED" };
  });
}
