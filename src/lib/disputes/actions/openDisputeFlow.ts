import {
  createAdminNotifications,
  createDisputeTimelineAndNotification,
  ensureDisputeCanBeOpened,
  getOrderDisputeContext,
  replaceDisputeSellerGroupImpacts,
  resolveImpactedSellerGroupIds,
  setDisputePayoutLocks,
} from "@/lib/disputes/disputeService";
import {
  createDisputeEvidenceInTx,
  snapshotExistingDeliveryEvidenceForDisputeInTx,
} from "@/lib/evidence/service";
import { getDisputePolicy } from "@/lib/disputes/policy";
import type { DisputeReason } from "@/generated/prisma/client";
import type { DisputeActionTx } from "./disputeAction.types";

export async function openDisputeFlow({
  tx,
  orderId,
  userId,
  reason,
  cleanDescription,
  sellerGroupIds,
  parsedEvidenceFiles,
}: {
  tx: DisputeActionTx;
  orderId: string;
  userId: string;
  reason: DisputeReason;
  cleanDescription: string | null;
  sellerGroupIds?: string[];
  parsedEvidenceFiles: Array<{
    fileUrl: string;
    fileKey?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    caption?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
}) {
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
    await createDisputeEvidenceInTx(
      tx,
      { userId, role: "USER" },
      {
        disputeId: dispute.id,
        visibility: "PARTIES_AND_ADMIN",
        isInternal: false,
        file,
      },
    );
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
}

