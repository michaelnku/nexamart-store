import { z } from "zod";

import {
  DeliveryEvidenceType,
  EvidenceType,
  EvidenceVisibility,
} from "@/generated/prisma/client";
import type { EvidenceFileInput, EvidenceViewerKind } from "@/lib/evidence/types";

const MAX_EVIDENCE_FILE_SIZE = 16 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
]);

const evidenceFileSchema = z.object({
  fileUrl: z.string().url(),
  fileKey: z.string().trim().min(1).max(255).nullish(),
  fileName: z.string().trim().min(1).max(255).nullish(),
  mimeType: z.string().trim().min(1).max(120).nullish(),
  fileSize: z.number().int().positive().max(MAX_EVIDENCE_FILE_SIZE).nullish(),
  caption: z.string().trim().max(280).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

export const createDeliveryEvidenceSchema = z.object({
  deliveryId: z.string().min(1),
  sellerGroupId: z.string().min(1).nullish(),
  kind: z.nativeEnum(DeliveryEvidenceType),
  visibility: z.nativeEnum(EvidenceVisibility).default("ADMIN_ONLY"),
  isInternal: z.boolean().default(false),
  capturedAt: z.coerce.date().nullish(),
  file: evidenceFileSchema,
});

export const createDisputeEvidenceSchema = z.object({
  disputeId: z.string().min(1),
  sellerGroupId: z.string().min(1).nullish(),
  visibility: z.nativeEnum(EvidenceVisibility).default("PARTIES_AND_ADMIN"),
  isInternal: z.boolean().default(false),
  type: z.nativeEnum(EvidenceType).optional(),
  deliveryEvidenceId: z.string().min(1).nullish(),
  messageId: z.string().min(1).nullish(),
  file: evidenceFileSchema,
});

export const linkDeliveryEvidenceSchema = z.object({
  disputeId: z.string().min(1),
  deliveryEvidenceId: z.string().min(1),
});

export const createDisputeMessageSchema = z.object({
  disputeId: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
  isInternal: z.boolean().default(false),
  attachments: z.array(evidenceFileSchema).max(6).default([]),
});

export function parseEvidenceFileInput(input: EvidenceFileInput): EvidenceFileInput {
  const parsed = evidenceFileSchema.parse(input);

  if (parsed.mimeType && !allowedMimeTypes.has(parsed.mimeType)) {
    throw new Error("Unsupported evidence file type.");
  }

  return parsed;
}

export function resolveEvidenceType(
  mimeType: string | null | undefined,
  fallback?: EvidenceType,
): EvidenceType {
  if (fallback) {
    return fallback;
  }

  if (mimeType?.startsWith("image/")) {
    return "PHOTO";
  }

  if (mimeType?.startsWith("video/")) {
    return "VIDEO";
  }

  return "DOCUMENT";
}

export function assertVisibilityAllowedForViewer(
  viewerKind: EvidenceViewerKind,
  visibility: EvidenceVisibility,
  isInternal: boolean,
) {
  if (viewerKind === "ADMIN" || viewerKind === "MODERATOR") {
    return;
  }

  if (isInternal || visibility === "ADMIN_ONLY") {
    throw new Error("Internal evidence can only be managed by admins.");
  }

  const allowedByViewer: Record<EvidenceViewerKind, EvidenceVisibility[]> = {
    ADMIN: Object.values(EvidenceVisibility),
    MODERATOR: Object.values(EvidenceVisibility),
    BUYER: ["PARTIES_AND_ADMIN", "BUYER_AND_ADMIN"],
    SELLER: ["PARTIES_AND_ADMIN", "SELLER_AND_ADMIN"],
    RIDER: ["PARTIES_AND_ADMIN", "RIDER_AND_ADMIN"],
  };

  if (!allowedByViewer[viewerKind].includes(visibility)) {
    throw new Error("You cannot set that evidence visibility.");
  }
}

export function isViewerAllowedToSeeEvidence(params: {
  viewerKind: EvidenceViewerKind;
  visibility: EvidenceVisibility;
  isInternal: boolean;
}) {
  const { viewerKind, visibility, isInternal } = params;

  if (viewerKind === "ADMIN" || viewerKind === "MODERATOR") {
    return true;
  }

  if (isInternal || visibility === "ADMIN_ONLY") {
    return false;
  }

  switch (viewerKind) {
    case "BUYER":
      return (
        visibility === "PARTIES_AND_ADMIN" || visibility === "BUYER_AND_ADMIN"
      );
    case "SELLER":
      return (
        visibility === "PARTIES_AND_ADMIN" || visibility === "SELLER_AND_ADMIN"
      );
    case "RIDER":
      return (
        visibility === "PARTIES_AND_ADMIN" || visibility === "RIDER_AND_ADMIN"
      );
    default:
      return false;
  }
}
