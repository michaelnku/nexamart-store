import { Prisma } from "@/generated/prisma";
import {
  DeliveryEvidenceType,
  type DeliveryStatus,
  DisputeMessageType,
  EvidenceVisibility,
  FileAssetCategory,
  FileAssetKind,
  type EvidenceType,
} from "@/generated/prisma/client";

import {
  assertDisputeMessageAccessOrThrow,
  assertLinkedDeliveryEvidenceBelongsToDispute,
  getDeliveryEvidenceAccessContextOrThrow,
  getDisputeActorContextOrThrow,
} from "@/lib/evidence/access";
import type {
  EvidenceFileInput,
  EvidenceUploadActor,
} from "@/lib/evidence/types";
import {
  assertVisibilityAllowedForViewer,
  parseEvidenceFileInput,
  resolveEvidenceType,
} from "@/lib/evidence/validation";

type Tx = Prisma.TransactionClient;

function toNullableJsonInput(
  metadata: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  if (metadata === null) {
    return Prisma.JsonNull;
  }

  return metadata as Prisma.InputJsonValue;
}

function applyDeliveryEvidenceSideEffects(
  tx: Tx,
  input: {
    deliveryId: string;
    kind: DeliveryEvidenceType;
    capturedAt?: Date | null;
  },
) {
  const failedAttemptIncrement =
    input.kind === "FAILED_ATTEMPT_PROOF" ? 1 : 0;
  const handoffConfirmedAt =
    input.kind === "HUB_HANDOFF_PROOF" ||
    input.kind === "STORE_HANDOFF_PROOF" ||
    input.kind === "STATION_PICKUP_PROOF"
      ? input.capturedAt ?? new Date()
      : undefined;

  return tx.delivery.update({
    where: { id: input.deliveryId },
    data: {
      hasDeliveryEvidence: true,
      lastEvidenceAt: input.capturedAt ?? new Date(),
      ...(failedAttemptIncrement > 0
        ? { failedAttemptCount: { increment: failedAttemptIncrement } }
        : {}),
      ...(handoffConfirmedAt ? { handoffConfirmedAt } : {}),
    },
  });
}

function assertRiderDeliveryEvidenceState(
  deliveryStatus: DeliveryStatus,
  kind: DeliveryEvidenceType,
) {
  const allowedStatusesByKind: Partial<
    Record<DeliveryEvidenceType, DeliveryStatus[]>
  > = {
    DROP_OFF_PROOF: ["PICKED_UP", "DELIVERED"],
    FAILED_ATTEMPT_PROOF: ["PICKED_UP"],
    RECIPIENT_CONFIRMATION_PROOF: ["PICKED_UP", "DELIVERED"],
    OTP_CONFIRMATION_PROOF: ["PICKED_UP", "DELIVERED"],
  };

  const allowedStatuses = allowedStatusesByKind[kind];

  if (!allowedStatuses?.includes(deliveryStatus)) {
    throw new Error(
      `Delivery status ${deliveryStatus} does not allow ${kind} uploads.`,
    );
  }
}

function sanitizeDeliveryEvidenceMetadata(
  kind: DeliveryEvidenceType,
  metadata: Record<string, unknown> | null | undefined,
) {
  if (kind !== "OTP_CONFIRMATION_PROOF") {
    return metadata;
  }

  return {
    proofType: "OTP_CONFIRMATION_PROOF",
  };
}

function normalizeEvidenceFile(input: EvidenceFileInput) {
  return parseEvidenceFileInput(input);
}

function normalizeStorageKey(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function extractStorageKeyFromUrl(fileUrl: string) {
  try {
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const fileSegmentIndex = parts.findIndex((part) => part === "f");

    if (fileSegmentIndex === -1) {
      return null;
    }

    return normalizeStorageKey(parts[fileSegmentIndex + 1]);
  } catch {
    return null;
  }
}

function resolveEvidenceStorageKey(file: EvidenceFileInput) {
  return normalizeStorageKey(file.fileKey) ?? extractStorageKeyFromUrl(file.fileUrl);
}

function inferFileAssetKind(
  mimeType: string | null | undefined,
): FileAssetKind {
  if (mimeType?.startsWith("image/")) {
    return "IMAGE";
  }

  if (mimeType?.startsWith("video/")) {
    return "VIDEO";
  }

  if (mimeType?.startsWith("audio/")) {
    return "AUDIO";
  }

  if (mimeType?.includes("pdf") || mimeType?.startsWith("application/")) {
    return "DOCUMENT";
  }

  return "OTHER";
}

function inferExtension(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
) {
  const fromName = fileName?.split(".").pop()?.trim().toLowerCase();

  if (fromName) {
    return fromName;
  }

  const subtype = mimeType?.split("/").pop()?.trim().toLowerCase();
  return subtype || null;
}

async function ensureEvidenceFileAsset(
  tx: Tx,
  input: {
    uploadedById: string;
    category: FileAssetCategory;
    file: EvidenceFileInput;
  },
) {
  const file = normalizeEvidenceFile(input.file);
  const storageKey = resolveEvidenceStorageKey(file);

  if (!storageKey) {
    throw new Error("Evidence upload is missing a stable storage key.");
  }

  const now = new Date();

  const asset = await tx.fileAsset.upsert({
    where: { storageKey },
    create: {
      storageProvider: "UPLOADTHING",
      storageKey,
      url: file.fileUrl,
      originalFileName: file.fileName,
      extension: inferExtension(file.fileName, file.mimeType),
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      category: input.category,
      kind: inferFileAssetKind(file.mimeType),
      status: "ACTIVE",
      isPublic: true,
      uploadedById: input.uploadedById,
      lastUsedAt: now,
      metadata: toNullableJsonInput(file.metadata),
    },
    update: {
      url: file.fileUrl,
      originalFileName: file.fileName ?? undefined,
      extension: inferExtension(file.fileName, file.mimeType) ?? undefined,
      mimeType: file.mimeType ?? undefined,
      fileSize: file.fileSize ?? undefined,
      kind: inferFileAssetKind(file.mimeType),
      status: "ACTIVE",
      isPublic: true,
      uploadedById: input.uploadedById,
      lastUsedAt: now,
      deletedAt: null,
      orphanedAt: null,
      metadata: toNullableJsonInput(file.metadata),
    },
    select: { id: true, mimeType: true },
  });

  return {
    asset,
    file,
  };
}

async function createDisputeEvidenceRecord(
  tx: Tx,
  input: {
    disputeId: string;
    uploadedById: string;
    type: EvidenceType;
    fileAssetId: string;
    caption?: string | null;
    metadata?: Record<string, unknown> | null;
    visibility: EvidenceVisibility;
    isInternal: boolean;
    sellerGroupId?: string | null;
    messageId?: string | null;
    deliveryEvidenceId?: string | null;
  },
) {
  return tx.disputeEvidence.create({
    data: {
      disputeId: input.disputeId,
      uploadedById: input.uploadedById,
      type: input.type,
      fileAssetId: input.fileAssetId,
      caption: input.caption,
      metadata: toNullableJsonInput(input.metadata),
      visibility: input.visibility,
      isInternal: input.isInternal,
      sellerGroupId: input.sellerGroupId,
      messageId: input.messageId,
      deliveryEvidenceId: input.deliveryEvidenceId,
    },
    select: { id: true },
  });
}

export async function createDeliveryEvidenceInTx(
  tx: Tx,
  actor: EvidenceUploadActor,
  input: {
    deliveryId: string;
    sellerGroupId?: string | null;
    kind: DeliveryEvidenceType;
    visibility: EvidenceVisibility;
    isInternal: boolean;
    capturedAt?: Date | null;
    file: EvidenceFileInput;
  },
) {
  const access = await getDeliveryEvidenceAccessContextOrThrow(tx, actor, {
    deliveryId: input.deliveryId,
    requestedSellerGroupId: input.sellerGroupId,
    kind: input.kind,
  });

  assertVisibilityAllowedForViewer(
    access.viewerKind,
    input.visibility,
    input.isInternal,
  );

  if (
    input.sellerGroupId &&
    !access.sellerGroupIds.includes(input.sellerGroupId)
  ) {
    throw new Error("Seller group does not belong to this delivery.");
  }

  if (access.viewerKind === "RIDER") {
    assertRiderDeliveryEvidenceState(access.deliveryStatus, input.kind);
  }

  const { asset, file } = await ensureEvidenceFileAsset(tx, {
    uploadedById: actor.userId,
    category: "DELIVERY_EVIDENCE",
    file: input.file,
  });

  const created = await tx.deliveryEvidence.create({
    data: {
      deliveryId: access.deliveryId,
      orderId: access.orderId,
      sellerGroupId: input.sellerGroupId,
      uploadedById: actor.userId,
      kind: input.kind,
      fileAssetId: asset.id,
      caption: file.caption,
      metadata: toNullableJsonInput(
        sanitizeDeliveryEvidenceMetadata(input.kind, file.metadata),
      ),
      capturedAt: input.capturedAt,
      isInternal: input.isInternal,
      visibility: input.visibility,
    },
    select: { id: true },
  });

  await applyDeliveryEvidenceSideEffects(tx, {
    deliveryId: access.deliveryId,
    kind: input.kind,
    capturedAt: input.capturedAt,
  });

  return created;
}

export async function createRiderDeliveryEvidenceInTx(
  tx: Tx,
  actor: EvidenceUploadActor,
  input: {
    deliveryId: string;
    kind: DeliveryEvidenceType;
    visibility: EvidenceVisibility;
    capturedAt?: Date | null;
    caption?: string | null;
    file: EvidenceFileInput;
  },
) {
  if (actor.role !== "RIDER") {
    throw new Error("Forbidden");
  }

  return createDeliveryEvidenceInTx(tx, actor, {
    deliveryId: input.deliveryId,
    kind: input.kind,
    visibility: input.visibility,
    isInternal: false,
    capturedAt: input.capturedAt,
    file: {
      ...input.file,
      caption: input.caption ?? input.file.caption,
    },
  });
}

export async function linkExistingDeliveryEvidenceToDisputeInTx(
  tx: Tx,
  actor: EvidenceUploadActor,
  input: {
    disputeId: string;
    deliveryEvidenceId: string;
  },
) {
  const access = await getDisputeActorContextOrThrow(tx, actor, input.disputeId);
  const deliveryEvidence = await assertLinkedDeliveryEvidenceBelongsToDispute(
    tx,
    input.disputeId,
    input.deliveryEvidenceId,
  );

  const existing = await tx.disputeEvidence.findFirst({
    where: {
      disputeId: input.disputeId,
      deliveryEvidenceId: input.deliveryEvidenceId,
    },
    select: { id: true },
  });

  await tx.deliveryEvidence.update({
    where: { id: input.deliveryEvidenceId },
    data: { linkedDisputeId: input.disputeId },
  });

  if (existing) {
    await tx.dispute.update({
      where: { id: input.disputeId },
      data: {
        deliveryEvidenceSnapshotTaken: true,
      },
    });

    return existing;
  }

  const source = await tx.deliveryEvidence.findUniqueOrThrow({
    where: { id: input.deliveryEvidenceId },
    select: {
      id: true,
      sellerGroupId: true,
      fileAssetId: true,
      fileAsset: {
        select: {
          mimeType: true,
        },
      },
      caption: true,
      metadata: true,
      isInternal: true,
      visibility: true,
    },
  });

  if (
    source.sellerGroupId &&
    access.viewerKind === "SELLER" &&
    !access.sellerGroupIds.includes(source.sellerGroupId)
  ) {
    throw new Error("Forbidden");
  }

  const created = await createDisputeEvidenceRecord(tx, {
    disputeId: input.disputeId,
    uploadedById: actor.userId,
    type: resolveEvidenceType(source.fileAsset.mimeType),
    fileAssetId: source.fileAssetId,
    caption: source.caption,
    metadata: source.metadata as Record<string, unknown> | null,
    visibility: source.visibility,
    isInternal: source.isInternal,
    sellerGroupId: source.sellerGroupId,
    deliveryEvidenceId: source.id,
  });

  await tx.dispute.update({
    where: { id: input.disputeId },
    data: {
      deliveryEvidenceSnapshotTaken: true,
    },
  });

  return created;
}

export async function snapshotExistingDeliveryEvidenceForDisputeInTx(
  tx: Tx,
  actor: EvidenceUploadActor,
  disputeId: string,
) {
  const dispute = await tx.dispute.findUnique({
    where: { id: disputeId },
    select: {
      id: true,
      orderId: true,
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found.");
  }

  const evidence = await tx.deliveryEvidence.findMany({
    where: { orderId: dispute.orderId },
    select: { id: true },
  });

  for (const item of evidence) {
    await linkExistingDeliveryEvidenceToDisputeInTx(tx, actor, {
      disputeId,
      deliveryEvidenceId: item.id,
    });
  }

  await tx.dispute.update({
    where: { id: disputeId },
    data: { deliveryEvidenceSnapshotTaken: true },
  });
}

export async function createDisputeEvidenceInTx(
  tx: Tx,
  actor: EvidenceUploadActor,
  input: {
    disputeId: string;
    sellerGroupId?: string | null;
    visibility: EvidenceVisibility;
    isInternal: boolean;
    type?: EvidenceType;
    deliveryEvidenceId?: string | null;
    messageId?: string | null;
    file: EvidenceFileInput;
  },
) {
  const access = await getDisputeActorContextOrThrow(tx, actor, input.disputeId);

  assertVisibilityAllowedForViewer(
    access.viewerKind,
    input.visibility,
    input.isInternal,
  );

  if (input.sellerGroupId && !access.sellerGroupIds.includes(input.sellerGroupId)) {
    throw new Error("Seller group does not belong to this dispute order.");
  }

  if (input.deliveryEvidenceId) {
    await assertLinkedDeliveryEvidenceBelongsToDispute(
      tx,
      input.disputeId,
      input.deliveryEvidenceId,
    );
  }

  const { asset, file } = await ensureEvidenceFileAsset(tx, {
    uploadedById: actor.userId,
    category: "DISPUTE_EVIDENCE",
    file: input.file,
  });

  return createDisputeEvidenceRecord(tx, {
    disputeId: input.disputeId,
    uploadedById: actor.userId,
    type: resolveEvidenceType(asset.mimeType, input.type),
    fileAssetId: asset.id,
    caption: file.caption,
    metadata: file.metadata,
    visibility: input.visibility,
    isInternal: input.isInternal,
    sellerGroupId: input.sellerGroupId,
    messageId: input.messageId,
    deliveryEvidenceId: input.deliveryEvidenceId,
  });
}

export async function createDisputeMessageWithAttachmentsInTx(
  tx: Tx,
  actor: EvidenceUploadActor,
  input: {
    disputeId: string;
    message: string;
    isInternal: boolean;
    attachments: EvidenceFileInput[];
  },
) {
  const access = await assertDisputeMessageAccessOrThrow(tx, actor, {
    disputeId: input.disputeId,
    isInternal: input.isInternal,
    messageType: input.isInternal ? "INTERNAL_NOTE" : "TEXT",
  });

  const messageType: DisputeMessageType = input.isInternal
    ? "INTERNAL_NOTE"
    : "TEXT";

  const createdMessage = await tx.disputeMessage.create({
    data: {
      disputeId: input.disputeId,
      senderId: actor.userId,
      message: input.message.trim(),
      isInternal: input.isInternal,
      messageType,
    },
    select: { id: true, createdAt: true },
  });

  for (const attachment of input.attachments) {
    const { asset, file } = await ensureEvidenceFileAsset(tx, {
      uploadedById: actor.userId,
      category: "DISPUTE_EVIDENCE",
      file: attachment,
    });

    await createDisputeEvidenceRecord(tx, {
      disputeId: input.disputeId,
      uploadedById: actor.userId,
      type: resolveEvidenceType(asset.mimeType),
      fileAssetId: asset.id,
      caption: file.caption,
      metadata: file.metadata,
      visibility:
        access.viewerKind === "ADMIN" || access.viewerKind === "MODERATOR"
          ? input.isInternal
            ? "ADMIN_ONLY"
            : "PARTIES_AND_ADMIN"
          : "PARTIES_AND_ADMIN",
      isInternal: input.isInternal,
      messageId: createdMessage.id,
    });
  }

  await tx.dispute.update({
    where: { id: input.disputeId },
    data: { lastMessageAt: createdMessage.createdAt },
  });

  return createdMessage;
}
