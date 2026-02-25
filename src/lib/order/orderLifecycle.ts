import { OrderStatus } from "@/generated/prisma/client";

export type LegacyOrderStatus = "SHIPPED" | "OUT_FOR_DELIVERY" | "PENDING";
export type AnyOrderStatus = OrderStatus | LegacyOrderStatus | string;

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "READY", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["IN_DELIVERY", "CANCELLED"],
  IN_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
  RETURN_REQUESTED: ["RETURNED", "CANCELLED"],
  RETURNED: ["REFUNDED", "CANCELLED"],
  REFUNDED: ["REFUNDED"],
};

export function normalizeOrderStatus(status: AnyOrderStatus): OrderStatus {
  if (status === "OUT_FOR_DELIVERY") return "IN_DELIVERY";
  if (status === "SHIPPED") return "IN_DELIVERY";
  if (status === "PENDING") return "PENDING_PAYMENT";
  return status as OrderStatus;
}

export function assertValidTransition(
  current: AnyOrderStatus,
  next: OrderStatus,
): void {
  const normalizedCurrent = normalizeOrderStatus(current);
  const allowed = VALID_TRANSITIONS[normalizedCurrent] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(
      `Invalid order status transition: ${normalizedCurrent} -> ${next}`,
    );
  }
}

