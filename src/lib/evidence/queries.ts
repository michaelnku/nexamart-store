import { Prisma } from "@/generated/prisma";
import type { DisputeMessageType, UserRole } from "@/generated/prisma/client";

import type {
  DisputeMessageAttachmentDTO,
  DisputeMessageWithAttachmentsDTO,
  EvidenceListItemDTO,
  EvidenceViewerKind,
} from "@/lib/evidence/types";
import { isViewerAllowedToSeeEvidence } from "@/lib/evidence/validation";
import { prisma } from "@/lib/prisma";

const deliveryEvidenceInclude = Prisma.validator<Prisma.DeliveryEvidenceInclude>()(
  {
    fileAsset: true,
    uploadedBy: {
      select: {
        id: true,
        name: true,
        role: true,
      },
    },
  },
);

const disputeEvidenceInclude = Prisma.validator<Prisma.DisputeEvidenceInclude>()({
  fileAsset: true,
  uploadedBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  deliveryEvidence: {
    include: deliveryEvidenceInclude,
  },
});

const disputeMessageInclude = Prisma.validator<Prisma.DisputeMessageInclude>()({
  sender: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  attachments: {
    include: disputeEvidenceInclude,
    orderBy: { createdAt: "asc" },
  },
});

type DeliveryEvidenceRecord = Prisma.DeliveryEvidenceGetPayload<{
  include: typeof deliveryEvidenceInclude;
}>;

type DisputeEvidenceRecord = Prisma.DisputeEvidenceGetPayload<{
  include: typeof disputeEvidenceInclude;
}>;

type DisputeMessageRecord = Prisma.DisputeMessageGetPayload<{
  include: typeof disputeMessageInclude;
}>;

function mapUploader(user: {
  id: string;
  name: string | null;
  role: UserRole;
}) {
  return {
    uploadedById: user.id,
    uploadedByName: user.name,
    uploadedByRole: user.role,
  };
}

export function mapDeliveryEvidenceToDTO(
  evidence: DeliveryEvidenceRecord,
): EvidenceListItemDTO {
  return {
    id: evidence.id,
    recordType: "DELIVERY_EVIDENCE",
    type:
      evidence.fileAsset.mimeType?.startsWith("image/")
        ? "PHOTO"
        : evidence.fileAsset.mimeType?.startsWith("video/")
          ? "VIDEO"
          : "DOCUMENT",
    deliveryKind: evidence.kind,
    fileUrl: evidence.fileAsset.url,
    fileKey: evidence.fileAsset.storageKey,
    fileName: evidence.fileAsset.originalFileName,
    mimeType: evidence.fileAsset.mimeType,
    fileSize: evidence.fileAsset.fileSize,
    caption: evidence.caption,
    createdAt: evidence.createdAt.toISOString(),
    capturedAt: evidence.capturedAt?.toISOString() ?? null,
    isInternal: evidence.isInternal,
    visibility: evidence.visibility,
    sellerGroupId: evidence.sellerGroupId,
    linkedDisputeId: evidence.linkedDisputeId,
    ...mapUploader(evidence.uploadedBy),
  };
}

export function mapDisputeEvidenceToDTO(
  evidence: DisputeEvidenceRecord,
): EvidenceListItemDTO {
  const sourceDeliveryEvidence = evidence.deliveryEvidence;
  const fileAsset = sourceDeliveryEvidence?.fileAsset ?? evidence.fileAsset;

  return {
    id: evidence.id,
    recordType: "DISPUTE_EVIDENCE",
    type: evidence.type,
    deliveryKind: sourceDeliveryEvidence?.kind ?? null,
    fileUrl: fileAsset.url,
    fileKey: fileAsset.storageKey,
    fileName: fileAsset.originalFileName,
    mimeType: fileAsset.mimeType,
    fileSize: fileAsset.fileSize,
    caption: evidence.caption ?? sourceDeliveryEvidence?.caption,
    createdAt: evidence.createdAt.toISOString(),
    capturedAt: sourceDeliveryEvidence?.capturedAt?.toISOString() ?? null,
    isInternal: evidence.isInternal,
    visibility: evidence.visibility,
    sellerGroupId: evidence.sellerGroupId,
    messageId: evidence.messageId,
    deliveryEvidenceId: evidence.deliveryEvidenceId,
    linkedDisputeId: sourceDeliveryEvidence?.linkedDisputeId ?? null,
    ...mapUploader(evidence.uploadedBy),
  };
}

function canViewEvidence(
  viewerKind: EvidenceViewerKind,
  evidence: { visibility: EvidenceListItemDTO["visibility"]; isInternal: boolean },
) {
  return isViewerAllowedToSeeEvidence({
    viewerKind,
    visibility: evidence.visibility,
    isInternal: evidence.isInternal,
  });
}

export function filterEvidenceForViewer<T extends EvidenceListItemDTO>(
  viewerKind: EvidenceViewerKind,
  evidence: T[],
) {
  return evidence.filter((item) => canViewEvidence(viewerKind, item));
}

export function mapDisputeMessageToDTO(
  viewerKind: EvidenceViewerKind,
  message: DisputeMessageRecord,
): DisputeMessageWithAttachmentsDTO | null {
  const isAdminLike = viewerKind === "ADMIN" || viewerKind === "MODERATOR";

  if (message.isInternal && !isAdminLike) {
    return null;
  }

  const attachments = filterEvidenceForViewer(
    viewerKind,
    message.attachments.map(mapDisputeEvidenceToDTO),
  ) as DisputeMessageAttachmentDTO[];

  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender.name,
    senderRole: message.sender.role,
    message: message.message,
    isInternal: message.isInternal,
    messageType: message.messageType as DisputeMessageType,
    createdAt: message.createdAt.toISOString(),
    attachments,
  };
}

export async function getDisputeEvidenceTimelineForViewer(params: {
  disputeId: string;
  viewerKind: EvidenceViewerKind;
}) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: params.disputeId },
    select: {
      evidence: {
        include: disputeEvidenceInclude,
        orderBy: { createdAt: "asc" },
      },
      linkedDeliveryEvidence: {
        include: deliveryEvidenceInclude,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!dispute) {
    return [];
  }

  const disputeEvidence = dispute.evidence.map(mapDisputeEvidenceToDTO);
  const deliveryOnlyEvidence = dispute.linkedDeliveryEvidence
    .filter(
      (item) =>
        !disputeEvidence.some(
          (evidence) => evidence.deliveryEvidenceId === item.id,
        ),
    )
    .map(mapDeliveryEvidenceToDTO);

  return filterEvidenceForViewer(params.viewerKind, [
    ...disputeEvidence,
    ...deliveryOnlyEvidence,
  ]).sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

export async function getDeliveryEvidenceForViewer(params: {
  viewerKind: EvidenceViewerKind;
  deliveryId?: string;
  orderId?: string;
  sellerGroupId?: string;
}) {
  const evidence = await prisma.deliveryEvidence.findMany({
    where: {
      ...(params.deliveryId ? { deliveryId: params.deliveryId } : {}),
      ...(params.orderId ? { orderId: params.orderId } : {}),
      ...(params.sellerGroupId ? { sellerGroupId: params.sellerGroupId } : {}),
    },
    include: deliveryEvidenceInclude,
    orderBy: { createdAt: "asc" },
  });

  return filterEvidenceForViewer(
    params.viewerKind,
    evidence.map(mapDeliveryEvidenceToDTO),
  );
}

export async function getDisputeMessagesForViewer(params: {
  disputeId: string;
  viewerKind: EvidenceViewerKind;
}) {
  const messages = await prisma.disputeMessage.findMany({
    where: { disputeId: params.disputeId },
    include: disputeMessageInclude,
    orderBy: { createdAt: "asc" },
  });

  return messages
    .map((message) => mapDisputeMessageToDTO(params.viewerKind, message))
    .filter(
      (message): message is DisputeMessageWithAttachmentsDTO =>
        message !== null,
    );
}
