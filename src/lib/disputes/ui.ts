import {
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
} from "@/generated/prisma/client";
import { getDisputePolicy } from "@/lib/disputes/policy";
import {
  OrderDetailDTO,
  OrderDisputeSummaryDTO,
  OrderTrackTimelineDTO,
} from "@/lib/types";

export type DisputeTimelineItem = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  tone?: "default" | "success" | "warning" | "danger";
};

const reasonLabels: Record<DisputeReason, string> = {
  ITEM_NOT_RECEIVED: "Item not received",
  ITEM_DAMAGED: "Item damaged",
  WRONG_ITEM: "Wrong item",
  NOT_AS_DESCRIBED: "Not as described",
  MISSING_ITEMS: "Missing items",
  OTHER: "Other",
};

const resolutionLabels: Record<DisputeResolution, string> = {
  REFUND_BUYER: "Full refund",
  PARTIAL_REFUND: "Partial refund",
  RELEASE_TO_SELLER: "Release to seller",
  RETURN_AND_REFUND: "Return and refund",
};

const statusLabels: Record<DisputeStatus, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  WAITING_FOR_SELLER: "Waiting for seller",
  WAITING_FOR_CUSTOMER: "Waiting for customer",
  WAITING_FOR_RETURN: "Waiting for return",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export function getDisputeReasonLabel(reason: DisputeReason): string {
  return reasonLabels[reason];
}

export function getDisputeResolutionLabel(
  resolution?: DisputeResolution | null,
): string {
  return resolution ? resolutionLabels[resolution] : "Pending";
}

export function getDisputeStatusLabel(status: DisputeStatus): string {
  return statusLabels[status];
}

export function getDisputeStatusClassName(status: DisputeStatus): string {
  switch (status) {
    case "OPEN":
      return "border-red-200 bg-red-50 text-red-700";
    case "UNDER_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "WAITING_FOR_SELLER":
    case "WAITING_FOR_CUSTOMER":
    case "WAITING_FOR_RETURN":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "RESOLVED":
      return "border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}

export function canCustomerRaiseDispute(order: OrderDetailDTO): boolean {
  if (order.status !== "DELIVERED" || order.dispute || !order.deliveredAt) {
    return false;
  }

  const policy = getDisputePolicy(Boolean(order.isFoodOrder), "OTHER");
  const deliveredAt = new Date(order.deliveredAt);

  return Date.now() <= deliveredAt.getTime() + policy.disputeWindowMs;
}

export function getDisputeWindowText(isFoodOrder: boolean): string {
  return isFoodOrder ? "1 hour after delivery" : "48 hours after delivery";
}

export function buildDisputeTimeline(
  dispute: OrderDisputeSummaryDTO,
  orderTimelines?: OrderTrackTimelineDTO[],
): DisputeTimelineItem[] {
  const baseItems: DisputeTimelineItem[] = [
    {
      id: `opened-${dispute.id}`,
      title: "Dispute opened",
      description: dispute.description,
      createdAt: dispute.createdAt,
      tone: "danger",
    },
    ...dispute.messages.map((message) => ({
      id: `message-${message.id}`,
      title: message.senderName ? `Message from ${message.senderName}` : "Message",
      description: message.message,
      createdAt: message.createdAt,
      tone: "default" as const,
    })),
  ];

  if (dispute.returnRequest?.shippedAt) {
    baseItems.push({
      id: `return-shipped-${dispute.returnRequest.id}`,
      title: "Return shipped",
      description: dispute.returnRequest.trackingNumber
        ? `Tracking number: ${dispute.returnRequest.trackingNumber}`
        : "Customer submitted return shipment details.",
      createdAt: dispute.returnRequest.shippedAt,
      tone: "warning",
    });
  }

  if (dispute.returnRequest?.receivedAt) {
    baseItems.push({
      id: `return-received-${dispute.returnRequest.id}`,
      title: "Return received",
      description: "Return was confirmed by the team.",
      createdAt: dispute.returnRequest.receivedAt,
      tone: "success",
    });
  }

  if (dispute.resolution) {
    baseItems.push({
      id: `resolution-${dispute.id}`,
      title: `Resolution: ${getDisputeResolutionLabel(dispute.resolution)}`,
      description:
        typeof dispute.refundAmount === "number"
          ? `Refund amount: $${dispute.refundAmount.toFixed(2)}`
          : undefined,
      createdAt: dispute.updatedAt,
      tone: dispute.resolution === "RELEASE_TO_SELLER" ? "default" : "success",
    });
  }

  const disputeOrderTimelineItems =
    orderTimelines
      ?.filter((item) =>
        ["DISPUTED", "RETURN_REQUESTED", "RETURNED", "COMPLETED", "REFUNDED"].includes(
          item.status,
        ),
      )
      .map((item) => ({
        id: `order-timeline-${item.id}`,
        title: item.status.replaceAll("_", " "),
        description: item.message,
        createdAt: item.createdAt,
        tone:
          item.status === "REFUNDED"
            ? ("success" as const)
            : item.status === "DISPUTED"
              ? ("danger" as const)
              : ("default" as const),
      })) ?? [];

  return [...baseItems, ...disputeOrderTimelineItems].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}
