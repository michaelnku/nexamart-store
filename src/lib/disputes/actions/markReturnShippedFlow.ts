import {
  createDisputeTimelineAndNotification,
  ensureActiveDispute,
  getOrderDisputeContext,
} from "@/lib/disputes/disputeService";
import type { DisputeActionTx } from "./disputeAction.types";

export async function markReturnShippedFlow({
  tx,
  orderId,
  userId,
  cleanTrackingNumber,
  carrier,
}: {
  tx: DisputeActionTx;
  orderId: string;
  userId: string;
  cleanTrackingNumber: string;
  carrier?: string;
}) {
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
}

