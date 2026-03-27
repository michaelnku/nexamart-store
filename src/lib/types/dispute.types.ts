import type {
  DeliveryType,
  DisputeMessageType,
  EvidenceVisibility,
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
  ReturnStatus,
  DeliveryEvidenceType,
} from "@/generated/prisma/client";
import type { OrderTrackTimelineDTO } from "./order-dto.types";

export type DisputeEvidenceDTO = {
  id: string;
  type: string;
  fileUrl: string;
  fileKey?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  caption?: string | null;
  recordType?: "DISPUTE_EVIDENCE" | "DELIVERY_EVIDENCE";
  deliveryKind?: DeliveryEvidenceType | null;
  visibility?: EvidenceVisibility;
  isInternal?: boolean;
  uploadedById?: string;
  uploadedByRole?: string | null;
  sellerGroupId?: string | null;
  messageId?: string | null;
  deliveryEvidenceId?: string | null;
  linkedDisputeId?: string | null;
  capturedAt?: string | null;
  uploadedByName?: string | null;
  createdAt: string;
};

export type DisputeMessageDTO = {
  id: string;
  senderName?: string | null;
  senderId: string;
  senderRole?: string | null;
  message: string;
  isInternal?: boolean;
  messageType?: DisputeMessageType;
  createdAt: string;
  attachments?: DisputeEvidenceDTO[];
};

export type DisputeSellerImpactDTO = {
  id?: string;
  sellerGroupId: string;
  refundAmount: number;
  sellerName?: string | null;
  storeName?: string | null;
};

export type ReturnRequestDTO = {
  id: string;
  status: ReturnStatus;
  trackingNumber?: string | null;
  carrier?: string | null;
  shippedAt?: string | null;
  receivedAt?: string | null;
};

export type OrderDisputeSummaryDTO = {
  id: string;
  orderId: string;
  status: DisputeStatus;
  reason: DisputeReason;
  description?: string | null;
  resolution?: DisputeResolution | null;
  refundAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  openedByName?: string | null;
  resolvedByName?: string | null;
  evidence: DisputeEvidenceDTO[];
  messages: DisputeMessageDTO[];
  sellerImpacts: DisputeSellerImpactDTO[];
  returnRequest?: ReturnRequestDTO | null;
  linkedDeliveryEvidence?: DisputeEvidenceDTO[];
};

export type SellerDisputeListItemDTO = {
  id: string;
  orderId: string;
  customerName?: string | null;
  customerEmail: string;
  status: DisputeStatus;
  reason: DisputeReason;
  createdAt: string;
  updatedAt: string;
  refundAmount?: number | null;
  affectedAmount: number;
  isFoodOrder: boolean;
  impactedGroups: DisputeSellerImpactDTO[];
};

export type SellerDisputeDetailDTO = SellerDisputeListItemDTO & {
  description?: string | null;
  resolution?: DisputeResolution | null;
  returnRequest?: ReturnRequestDTO | null;
  evidence: DisputeEvidenceDTO[];
  messages: DisputeMessageDTO[];
  orderTimelines: OrderTrackTimelineDTO[];
  delivery?: {
    id: string;
    status: string;
    riderName?: string | null;
    riderEmail?: string | null;
    deliveredAt?: string | null;
  } | null;
  linkedDeliveryEvidence?: DisputeEvidenceDTO[];
};

export type AdminDisputeDetailDTO = {
  id: string;
  orderId: string;
  status: DisputeStatus;
  reason: DisputeReason;
  resolution?: DisputeResolution | null;
  description?: string | null;
  refundAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  isFoodOrder: boolean;
  deliveryType?: DeliveryType;
  orderTrackingNumber?: string | null;
  openedByName?: string | null;
  resolvedByName?: string | null;
  refundRecordedAt?: string | null;
  attentionLevel?: "NORMAL" | "HIGH" | "CRITICAL";
  attentionAgeHours?: number;
  customer: {
    id?: string;
    name?: string | null;
    email: string;
  };
  sellers: Array<{
    sellerId: string;
    sellerName?: string | null;
    storeName?: string | null;
    sellerGroupId: string;
    refundAmount: number;
    payoutLocked?: boolean;
    payoutStatus?: string;
    payoutReleasedAt?: string | null;
  }>;
  delivery?: {
    id: string;
    status: string;
    riderId?: string | null;
    riderName?: string | null;
    riderEmail?: string | null;
    deliveredAt?: string | null;
    payoutLocked?: boolean;
    payoutReleasedAt?: string | null;
  } | null;
  evidence: DisputeEvidenceDTO[];
  messages: DisputeMessageDTO[];
  sellerImpacts: DisputeSellerImpactDTO[];
  returnRequest?: ReturnRequestDTO | null;
  orderTimelines: OrderTrackTimelineDTO[];
  totalAmount: number;
  linkedDeliveryEvidence?: DisputeEvidenceDTO[];
};
