import { UserRole } from "@/generated/prisma/client";

export const AUDIT_ACTION_TYPES = [
  "USER_ROLE_UPDATED",
  "STAFF_VERIFICATION_GRANTED",
  "STAFF_VERIFICATION_CLEARED",
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
  "DISPUTE",
  "WITHDRAWAL",
  "HERO_BANNER",
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
  DISPUTE: "Dispute",
  WITHDRAWAL: "Withdrawal",
  HERO_BANNER: "Hero banner",
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
