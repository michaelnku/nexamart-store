import { UserRole } from "@/generated/prisma/client";

export const AUDIT_ACTION_TYPES = [
  "USER_ROLE_UPDATED",
  "STAFF_VERIFICATION_GRANTED",
  "STAFF_VERIFICATION_CLEARED",
  "MODERATION_INCIDENT_CONFIRMED",
  "MODERATION_INCIDENT_OVERTURNED",
  "MODERATION_INCIDENT_IGNORED",
  "MODERATION_INCIDENT_ESCALATED",
  "USER_REPORT_MARKED_UNDER_REVIEW",
  "USER_REPORT_RESOLVED",
  "USER_REPORT_REJECTED",
  "USER_MODERATION_SOFT_BLOCKED",
  "USER_MODERATION_SOFT_BLOCK_CLEARED",
  "USER_MODERATION_SUMMARY_RESET",
  "PRODUCT_MODERATION_UNPUBLISHED",
  "PRODUCT_MODERATION_REPUBLISHED",
  "DISPUTE_RESOLVED",
  "DISPUTE_RETURN_CONFIRMED",
  "SELLER_WITHDRAWAL_APPROVED",
  "RIDER_WITHDRAWAL_APPROVED",
  "PLATFORM_WITHDRAWAL_REQUESTED",
  "PLATFORM_WITHDRAWAL_APPROVED",
  "HERO_BANNER_CREATED",
  "HERO_BANNER_UPDATED",
  "HERO_BANNER_DELETED",
  "HERO_BANNER_STATUS_CHANGED",
  "HERO_BANNER_REORDERED",
  "MARKETING_CAMPAIGN_CREATED",
  "MARKETING_CAMPAIGN_UPDATED",
  "MARKETING_CAMPAIGN_ARCHIVED",
  "FEATURED_STORE_PLACEMENT_CREATED",
  "FEATURED_STORE_PLACEMENT_UPDATED",
  "FEATURED_STORE_PLACEMENT_DELETED",
  "FEATURED_STORE_PLACEMENT_STATUS_CHANGED",
  "FEATURED_STORE_PLACEMENT_REORDERED",
  "FEATURED_PRODUCT_PLACEMENT_CREATED",
  "FEATURED_PRODUCT_PLACEMENT_UPDATED",
  "FEATURED_PRODUCT_PLACEMENT_DELETED",
  "FEATURED_PRODUCT_PLACEMENT_STATUS_CHANGED",
  "FEATURED_PRODUCT_PLACEMENT_REORDERED",
  "COUPON_CREATED",
  "COUPON_UPDATED",
  "COUPON_STATUS_CHANGED",
  "COUPON_DELETED",
  "COUPON_RESTORED",
  "PLATFORM_SETTINGS_UPDATED",
  "SHIPPING_SETTINGS_UPDATED",
  "SUPPORT_AGENT_ASSIGNED",
  "DELIVERY_UNLOCKED",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DELETED",
] as const;

export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[number];

export const AUDIT_ENTITY_TYPES = [
  "USER",
  "STAFF_PROFILE",
  "MODERATION_INCIDENT",
  "USER_REPORT",
  "PRODUCT",
  "DISPUTE",
  "WITHDRAWAL",
  "HERO_BANNER",
  "MARKETING_CAMPAIGN",
  "MARKETING_PLACEMENT",
  "COUPON",
  "SITE_CONFIGURATION",
  "CONVERSATION",
  "DELIVERY",
  "CATEGORY",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  USER_ROLE_UPDATED: "User role updated",
  STAFF_VERIFICATION_GRANTED: "Staff verification granted",
  STAFF_VERIFICATION_CLEARED: "Staff verification cleared",
  MODERATION_INCIDENT_CONFIRMED: "Moderation incident confirmed",
  MODERATION_INCIDENT_OVERTURNED: "Moderation incident overturned",
  MODERATION_INCIDENT_IGNORED: "Moderation incident ignored",
  MODERATION_INCIDENT_ESCALATED: "Moderation incident escalated",
  USER_REPORT_MARKED_UNDER_REVIEW: "User report marked under review",
  USER_REPORT_RESOLVED: "User report resolved",
  USER_REPORT_REJECTED: "User report rejected",
  USER_MODERATION_SOFT_BLOCKED: "User moderation soft block applied",
  USER_MODERATION_SOFT_BLOCK_CLEARED: "User moderation soft block cleared",
  USER_MODERATION_SUMMARY_RESET: "User moderation summary reset",
  PRODUCT_MODERATION_UNPUBLISHED: "Product unpublished by moderation",
  PRODUCT_MODERATION_REPUBLISHED: "Product republished by moderation",
  DISPUTE_RESOLVED: "Dispute resolved",
  DISPUTE_RETURN_CONFIRMED: "Dispute return confirmed",
  SELLER_WITHDRAWAL_APPROVED: "Seller withdrawal approved",
  RIDER_WITHDRAWAL_APPROVED: "Rider withdrawal approved",
  PLATFORM_WITHDRAWAL_REQUESTED: "Platform withdrawal requested",
  PLATFORM_WITHDRAWAL_APPROVED: "Platform withdrawal approved",
  HERO_BANNER_CREATED: "Hero banner created",
  HERO_BANNER_UPDATED: "Hero banner updated",
  HERO_BANNER_DELETED: "Hero banner deleted",
  HERO_BANNER_STATUS_CHANGED: "Hero banner status changed",
  HERO_BANNER_REORDERED: "Hero banner reordered",
  MARKETING_CAMPAIGN_CREATED: "Marketing campaign created",
  MARKETING_CAMPAIGN_UPDATED: "Marketing campaign updated",
  MARKETING_CAMPAIGN_ARCHIVED: "Marketing campaign archived",
  FEATURED_STORE_PLACEMENT_CREATED: "Featured store placement created",
  FEATURED_STORE_PLACEMENT_UPDATED: "Featured store placement updated",
  FEATURED_STORE_PLACEMENT_DELETED: "Featured store placement deleted",
  FEATURED_STORE_PLACEMENT_STATUS_CHANGED:
    "Featured store placement status changed",
  FEATURED_STORE_PLACEMENT_REORDERED: "Featured store placement reordered",
  FEATURED_PRODUCT_PLACEMENT_CREATED: "Featured product placement created",
  FEATURED_PRODUCT_PLACEMENT_UPDATED: "Featured product placement updated",
  FEATURED_PRODUCT_PLACEMENT_DELETED: "Featured product placement deleted",
  FEATURED_PRODUCT_PLACEMENT_STATUS_CHANGED:
    "Featured product placement status changed",
  FEATURED_PRODUCT_PLACEMENT_REORDERED: "Featured product placement reordered",
  COUPON_CREATED: "Coupon created",
  COUPON_UPDATED: "Coupon updated",
  COUPON_STATUS_CHANGED: "Coupon status changed",
  COUPON_DELETED: "Coupon archived",
  COUPON_RESTORED: "Coupon restored",
  PLATFORM_SETTINGS_UPDATED: "Platform settings updated",
  SHIPPING_SETTINGS_UPDATED: "Shipping settings updated",
  SUPPORT_AGENT_ASSIGNED: "Support agent assigned",
  DELIVERY_UNLOCKED: "Delivery unlocked",
  CATEGORY_CREATED: "Category created",
  CATEGORY_UPDATED: "Category updated",
  CATEGORY_DELETED: "Category deleted",
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  USER: "User",
  STAFF_PROFILE: "Staff profile",
  MODERATION_INCIDENT: "Moderation incident",
  USER_REPORT: "User report",
  PRODUCT: "Product",
  DISPUTE: "Dispute",
  WITHDRAWAL: "Withdrawal",
  HERO_BANNER: "Hero banner",
  MARKETING_CAMPAIGN: "Marketing campaign",
  MARKETING_PLACEMENT: "Marketing placement",
  COUPON: "Coupon",
  SITE_CONFIGURATION: "Site configuration",
  CONVERSATION: "Conversation",
  DELIVERY: "Delivery",
  CATEGORY: "Category",
};

export type AuditMetadata =
  | string
  | number
  | boolean
  | null
  | AuditMetadata[]
  | { [key: string]: AuditMetadata };

export type CreateAuditLogInput = {
  actorId?: string | null;
  actorRole: UserRole;
  actionType: AuditActionType;
  targetEntityType: AuditEntityType;
  targetEntityId?: string | null;
  summary: string;
  metadata?: Record<string, AuditMetadata> | null;
};

export type AuditLogListItem = {
  id: string;
  createdAt: string;
  actor: {
    id: string | null;
    role: UserRole;
    name: string | null;
    email: string | null;
  };
  actionType: AuditActionType;
  targetEntityType: AuditEntityType;
  targetEntityId: string | null;
  summary: string;
  metadata: Record<string, AuditMetadata> | null;
};
