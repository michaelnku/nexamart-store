import type { DisputeReason, DisputeStatus } from "@/generated/prisma/client";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "IN_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "DISPUTED"
  | "RETURNED"
  | "REFUNDED";

export type DeliveryType =
  | "HOME_DELIVERY"
  | "STORE_PICKUP"
  | "STATION_PICKUP"
  | "EXPRESS";

export type SellerOrder = {
  id: string;
  status: OrderStatus;
  isFoodOrder?: boolean;
  deliveryType: DeliveryType;
  totalAmount: number;
  dispute?: {
    id: string;
    status: DisputeStatus;
    reason: DisputeReason;
  } | null;
  sellerGroups: {
    id: string;
    status: string;
    prepTimeMinutes?: number | null;
    readyAt?: string | Date | null;
    store?: {
      name?: string | null;
    } | null;
  }[];
  customer?: {
    name?: string | null;
  } | null;
};
