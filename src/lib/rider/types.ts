import { DeliveryStatus } from "@/generated/prisma/client";

export const RIDER_DELIVERY_STATUS_TABS = [
  { key: "pending", label: "Pending" },
  { key: "assigned", label: "Assigned" },
  { key: "ongoing", label: "Ongoing" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export type RiderDeliveryStatusKey =
  (typeof RIDER_DELIVERY_STATUS_TABS)[number]["key"];

export type RiderDeliveryCounts = Record<RiderDeliveryStatusKey, number>;

export const RIDER_DELIVERY_STATUS_FILTERS: Record<
  RiderDeliveryStatusKey,
  DeliveryStatus[]
> = {
  pending: ["PENDING_ASSIGNMENT"],
  assigned: ["ASSIGNED"],
  ongoing: ["PICKED_UP"],
  delivered: ["DELIVERED"],
  cancelled: ["CANCELLED"],
};

export function parseRiderDeliveryStatusKey(
  value: string | undefined,
): RiderDeliveryStatusKey {
  const normalized = (value ?? "assigned").toLowerCase();
  if (
    RIDER_DELIVERY_STATUS_TABS.some((tab) => tab.key === normalized)
  ) {
    return normalized as RiderDeliveryStatusKey;
  }
  return "assigned";
}

export function canAutoAssignForOrderStatus(status: string): boolean {
  return status === "READY" || status === "ACCEPTED" || status === "SHIPPED";
}

export function canVerifyDeliveryStatus(status: string): boolean {
  return status === "PICKED_UP" || status === "IN_TRANSIT";
}

export const RIDER_CLIENT_STATUS_LABELS = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  ONGOING: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
} as const;

export type RiderClientDeliveryStatus = keyof typeof RIDER_CLIENT_STATUS_LABELS;

export const RIDER_CLIENT_STATUS_STYLES: Record<
  RiderClientDeliveryStatus,
  string
> = {
  PENDING:
    "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200",
  ASSIGNED:
    "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200",
  ONGOING:
    "bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-200",
  DELIVERED:
    "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  CANCELLED:
    "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200",
};

export function toRiderClientDeliveryStatus(
  status: string,
): RiderClientDeliveryStatus {
  if (status === "PENDING_ASSIGNMENT" || status === "PENDING") return "PENDING";
  if (status === "ASSIGNED") return "ASSIGNED";
  if (status === "PICKED_UP" || status === "IN_TRANSIT") return "ONGOING";
  if (status === "DELIVERED") return "DELIVERED";
  return "CANCELLED";
}

export function canVerifyClientDeliveryStatus(
  status: RiderClientDeliveryStatus,
): boolean {
  return status === "ONGOING";
}
