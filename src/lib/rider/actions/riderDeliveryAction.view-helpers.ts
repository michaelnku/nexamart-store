import { DeliveryStatus } from "@/generated/prisma/client";
import { toRiderClientDeliveryStatus } from "@/lib/rider/types";
import type { RiderDeliveryPendingOrderRow } from "./riderDeliveryAction.types";

export function buildDeliveryAddress(order: {
  deliveryStreet: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryCountry: string;
  deliveryPostal: string;
}) {
  return [
    order.deliveryStreet,
    order.deliveryCity,
    order.deliveryState,
    order.deliveryCountry,
    order.deliveryPostal,
  ]
    .filter((part) => Boolean(part && part.trim()))
    .join(", ");
}

export function mapDeliveryWithClientAddress<
  T extends {
    status: string;
    order: {
      deliveryStreet: string;
      deliveryCity: string;
      deliveryState: string;
      deliveryCountry: string;
      deliveryPostal: string;
    };
  },
>(delivery: T) {
  const deliveryAddress = buildDeliveryAddress(delivery.order);

  return {
    ...delivery,
    clientStatus: toRiderClientDeliveryStatus(delivery.status),
    order: {
      ...delivery.order,
      deliveryAddress,
    },
  };
}

export function mapPendingOrderRow(order: {
  id: string;
  trackingNumber: string | null;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryCountry: string;
  deliveryPostal: string;
  totalAmount: number;
  shippingFee: number;
  status: string;
  createdAt: Date;
  customer: { name: string | null; email: string };
}): RiderDeliveryPendingOrderRow {
  const deliveryAddress = buildDeliveryAddress(order);

  return {
    id: `pending-order-${order.id}`,
    orderId: order.id,
    riderId: null,
    otpHash: null,
    otpExpiresAt: null,
    otpAttempts: 0,
    isLocked: false,
    lockedAt: null,
    status: "PENDING_ASSIGNMENT" as DeliveryStatus,
    clientStatus: toRiderClientDeliveryStatus("PENDING_ASSIGNMENT"),
    deliveryAddress: null,
    distance: null,
    fee: order.shippingFee,
    assignedAt: null,
    deliveredAt: null,
    order: {
      ...order,
      deliveryAddress,
    },
    isPendingAssignment: true,
  };
}

