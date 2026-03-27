import type {
  DeliveryEvidenceType,
  DisputeMessageType,
  EvidenceType,
  EvidenceVisibility,
  UserRole,
} from "@/generated/prisma/client";

export type EvidenceViewerKind =
  | "ADMIN"
  | "MODERATOR"
  | "BUYER"
  | "SELLER"
  | "RIDER";

export type EvidenceFileInput = {
  fileUrl: string;
  fileKey?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  caption?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type EvidenceUploadActor = {
  userId: string;
  role: UserRole;
};

export type EvidenceListItemDTO = {
  id: string;
  recordType: "DISPUTE_EVIDENCE" | "DELIVERY_EVIDENCE";
  type: EvidenceType;
  deliveryKind?: DeliveryEvidenceType | null;
  fileUrl: string;
  fileKey?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  caption?: string | null;
  createdAt: string;
  capturedAt?: string | null;
  isInternal: boolean;
  visibility: EvidenceVisibility;
  uploadedById: string;
  uploadedByName?: string | null;
  uploadedByRole?: UserRole | null;
  sellerGroupId?: string | null;
  messageId?: string | null;
  deliveryEvidenceId?: string | null;
  linkedDisputeId?: string | null;
};

export type DisputeMessageAttachmentDTO = EvidenceListItemDTO & {
  recordType: "DISPUTE_EVIDENCE";
};

export type DisputeMessageWithAttachmentsDTO = {
  id: string;
  senderId: string;
  senderName?: string | null;
  senderRole?: UserRole | null;
  message: string;
  isInternal: boolean;
  messageType: DisputeMessageType;
  createdAt: string;
  attachments: DisputeMessageAttachmentDTO[];
};
