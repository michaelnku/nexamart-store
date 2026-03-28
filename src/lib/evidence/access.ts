import type { Prisma } from "@/generated/prisma";
import {
  DeliveryEvidenceType,
  DisputeMessageType,
  type DeliveryStatus,
  type UserRole,
} from "@/generated/prisma/client";

import type {
  EvidenceUploadActor,
  EvidenceViewerKind,
} from "@/lib/evidence/types";

type TxLike = Pick<
  Prisma.TransactionClient,
  "delivery" | "deliveryEvidence" | "dispute" | "disputeMessage"
>;

const riderDeliveryEvidenceKinds = new Set<DeliveryEvidenceType>([
  "DROP_OFF_PROOF",
  "FAILED_ATTEMPT_PROOF",
  "OTP_CONFIRMATION_PROOF",
  "RECIPIENT_CONFIRMATION_PROOF",
  "STATION_PICKUP_PROOF",
]);

const sellerDeliveryEvidenceKinds = new Set<DeliveryEvidenceType>([
  "PICKUP_PROOF",
  "PACKAGE_CONDITION_PROOF",
  "HUB_HANDOFF_PROOF",
  "STORE_HANDOFF_PROOF",
  "STATION_PICKUP_PROOF",
]);

function toViewerKind(role: UserRole): EvidenceViewerKind | null {
  switch (role) {
    case "ADMIN":
      return "ADMIN";
    case "MODERATOR":
      return "MODERATOR";
    case "SELLER":
      return "SELLER";
    case "RIDER":
      return "RIDER";
    case "USER":
      return "BUYER";
    default:
      return null;
  }
}

export type DeliveryEvidenceAccessContext = {
  viewerKind: EvidenceViewerKind;
  deliveryId: string;
  orderId: string;
  sellerGroupIds: string[];
  riderId: string | null;
  deliveryStatus: DeliveryStatus;
};

export type DisputeActorContext = {
  viewerKind: EvidenceViewerKind;
  disputeId: string;
  orderId: string;
  sellerGroupIds: string[];
  riderId: string | null;
  buyerId: string;
};

export async function getDeliveryEvidenceAccessContextOrThrow(
  db: TxLike,
  actor: EvidenceUploadActor,
  input: {
    deliveryId: string;
    requestedSellerGroupId?: string | null;
    kind: DeliveryEvidenceType;
  },
): Promise<DeliveryEvidenceAccessContext> {
  const viewerKind = toViewerKind(actor.role);
  if (!viewerKind) {
    throw new Error("Forbidden");
  }

  const delivery = await db.delivery.findUnique({
    where: { id: input.deliveryId },
    select: {
      id: true,
      riderId: true,
      status: true,
      orderId: true,
      order: {
        select: {
          userId: true,
          sellerGroups: {
            select: {
              id: true,
              sellerId: true,
            },
          },
        },
      },
    },
  });

  if (!delivery) {
    throw new Error("Delivery not found.");
  }

  const sellerGroups = delivery.order.sellerGroups;
  const sellerGroupIds = sellerGroups.map((group) => group.id);
  const ownsRequestedGroup =
    !input.requestedSellerGroupId ||
    sellerGroups.some(
      (group) =>
        group.id === input.requestedSellerGroupId &&
        group.sellerId === actor.userId,
    );

  const isAdminLike = viewerKind === "ADMIN" || viewerKind === "MODERATOR";
  const isAssignedRider = delivery.riderId === actor.userId;
  const isSellerForOrder = sellerGroups.some(
    (group) => group.sellerId === actor.userId,
  );

  if (isAdminLike) {
    return {
      viewerKind,
      deliveryId: delivery.id,
      orderId: delivery.orderId,
      sellerGroupIds,
      riderId: delivery.riderId,
      deliveryStatus: delivery.status,
    };
  }

  if (
    viewerKind === "RIDER" &&
    isAssignedRider &&
    riderDeliveryEvidenceKinds.has(input.kind)
  ) {
    return {
      viewerKind,
      deliveryId: delivery.id,
      orderId: delivery.orderId,
      sellerGroupIds,
      riderId: delivery.riderId,
      deliveryStatus: delivery.status,
    };
  }

  if (
    viewerKind === "SELLER" &&
    isSellerForOrder &&
    ownsRequestedGroup &&
    sellerDeliveryEvidenceKinds.has(input.kind)
  ) {
    return {
      viewerKind,
      deliveryId: delivery.id,
      orderId: delivery.orderId,
      sellerGroupIds,
      riderId: delivery.riderId,
      deliveryStatus: delivery.status,
    };
  }

  throw new Error("Forbidden");
}

export async function getDisputeActorContextOrThrow(
  db: TxLike,
  actor: EvidenceUploadActor,
  disputeId: string,
): Promise<DisputeActorContext> {
  const viewerKind = toViewerKind(actor.role);
  if (!viewerKind) {
    throw new Error("Forbidden");
  }

  const dispute = await db.dispute.findUnique({
    where: { id: disputeId },
    select: {
      id: true,
      orderId: true,
      order: {
        select: {
          userId: true,
          delivery: {
            select: {
              riderId: true,
            },
          },
          sellerGroups: {
            select: {
              id: true,
              sellerId: true,
            },
          },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found.");
  }

  const sellerGroups = dispute.order.sellerGroups;
  const sellerGroupIds = sellerGroups.map((group) => group.id);

  const isAdminLike = viewerKind === "ADMIN" || viewerKind === "MODERATOR";
  const isBuyer = dispute.order.userId === actor.userId;
  const isSeller = sellerGroups.some((group) => group.sellerId === actor.userId);
  const isRider = dispute.order.delivery?.riderId === actor.userId;

  if (!isAdminLike && !isBuyer && !isSeller && !isRider) {
    throw new Error("Forbidden");
  }

  return {
    viewerKind,
    disputeId: dispute.id,
    orderId: dispute.orderId,
    sellerGroupIds,
    riderId: dispute.order.delivery?.riderId ?? null,
    buyerId: dispute.order.userId,
  };
}

export async function assertDisputeMessageAccessOrThrow(
  db: TxLike,
  actor: EvidenceUploadActor,
  input: {
    disputeId: string;
    isInternal: boolean;
    messageType: DisputeMessageType;
  },
) {
  const context = await getDisputeActorContextOrThrow(db, actor, input.disputeId);

  if (
    (input.isInternal || input.messageType === "INTERNAL_NOTE") &&
    context.viewerKind !== "ADMIN" &&
    context.viewerKind !== "MODERATOR"
  ) {
    throw new Error("Internal dispute notes are restricted.");
  }

  return context;
}

export async function assertLinkedDeliveryEvidenceBelongsToDispute(
  db: TxLike,
  disputeId: string,
  deliveryEvidenceId: string,
) {
  const [dispute, deliveryEvidence] = await Promise.all([
    db.dispute.findUnique({
      where: { id: disputeId },
      select: { orderId: true },
    }),
    db.deliveryEvidence.findUnique({
      where: { id: deliveryEvidenceId },
      select: { id: true, orderId: true },
    }),
  ]);

  if (!dispute) {
    throw new Error("Dispute not found.");
  }

  if (!deliveryEvidence || deliveryEvidence.orderId !== dispute.orderId) {
    throw new Error("Delivery evidence does not belong to this dispute order.");
  }

  return deliveryEvidence;
}
