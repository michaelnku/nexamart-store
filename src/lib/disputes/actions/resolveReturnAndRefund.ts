import { createAuditLog } from "@/lib/audit/service";
import {
  createDisputeTimelineAndNotification,
  openReturnRequestInTx,
} from "@/lib/disputes/disputeService";
import type { ResolveDisputeSharedParams } from "./disputeAction.types";

export async function resolveReturnAndRefund(
  params: ResolveDisputeSharedParams,
) {
  const { tx, activeDispute, policy, adminId, actorRole, orderId, order } =
    params;

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
      actorRole,
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

  return { success: true, nextStep: "RETURN_REQUESTED" as const };
}

