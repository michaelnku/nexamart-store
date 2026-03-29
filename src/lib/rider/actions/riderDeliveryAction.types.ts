import type { DeliveryStatus } from "@/generated/prisma/client";

export type RiderDeliveryActionError = {
  error: "Unauthorized" | "Forbidden";
};

export type RiderDeliveryAuthSuccess = {
  userId: string;
};

export type RiderDeliveryAuthResult =
  | RiderDeliveryAuthSuccess
  | RiderDeliveryActionError;

export type RiderDeliveryPendingOrderRow = {
  id: string;
  orderId: string;
  riderId: null;
  otpHash: null;
  otpExpiresAt: null;
  otpAttempts: number;
  isLocked: boolean;
  lockedAt: null;
  status: DeliveryStatus;
  clientStatus: ReturnType<
    typeof import("@/lib/rider/types").toRiderClientDeliveryStatus
  >;
  deliveryAddress: null;
  distance: null;
  fee: number;
  assignedAt: null;
  deliveredAt: null;
  order: {
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
    deliveryAddress: string;
  };
  isPendingAssignment: true;
};
