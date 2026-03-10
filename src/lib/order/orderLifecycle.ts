import { OrderStatus } from "@/generated/prisma/client";

export type LegacyOrderStatus = "PENDING";
export type AnyOrderStatus = OrderStatus | LegacyOrderStatus | string;

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],

  PAID: ["ACCEPTED", "CANCELLED"],

  ACCEPTED: ["PREPARING", "READY", "CANCELLED"],

  PREPARING: ["READY", "CANCELLED"],

  READY: ["IN_DELIVERY", "CANCELLED"],

  IN_DELIVERY: ["DELIVERED"],

  DELIVERED: ["COMPLETED", "DISPUTED"],

  DISPUTED: ["COMPLETED", "REFUNDED", "RETURN_REQUESTED"],

  RETURN_REQUESTED: ["RETURNED", "CANCELLED"],

  RETURNED: ["REFUNDED"],

  COMPLETED: ["COMPLETED"],

  REFUNDED: ["REFUNDED"],

  CANCELLED: ["CANCELLED"],
};

export function normalizeOrderStatus(status: AnyOrderStatus): OrderStatus {
  if (status === "PENDING") return "PENDING_PAYMENT";
  return status as OrderStatus;
}

export function assertValidTransition(
  current: AnyOrderStatus,
  next: OrderStatus,
): void {
  const normalizedCurrent = normalizeOrderStatus(current);
  const allowed = VALID_TRANSITIONS[normalizedCurrent as OrderStatus] ?? [];

  if (!allowed.includes(next)) {
    throw new Error(
      `Invalid order status transition: ${normalizedCurrent} -> ${next}`,
    );
  }
}
