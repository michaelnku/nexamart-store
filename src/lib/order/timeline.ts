import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/client";

type TimelineStatus =
  | "PENDING"
  | "PENDING_PAYMENT"
  | "PAID"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "IN_DELIVERY"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

type Tx = Prisma.TransactionClient;

function normalizeTimelineStatus(status: TimelineStatus): OrderStatus {
  if (status === "PENDING") return "PENDING_PAYMENT";
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") {
    return "IN_DELIVERY";
  }
  return status as OrderStatus;
}

export async function addOrderTimelineOnce(
  params: {
    orderId: string;
    status: TimelineStatus;
    message: string;
  },
  tx?: Tx,
) {
  const db = tx ?? prisma;
  const normalizedStatus = normalizeTimelineStatus(params.status);

  const existing = await db.orderTimeline.findFirst({
    where: {
      orderId: params.orderId,
      status: normalizedStatus,
      message: params.message,
    },
    select: { id: true },
  });

  if (existing) return;

  await db.orderTimeline.create({
    data: {
      orderId: params.orderId,
      status: normalizedStatus,
      message: params.message,
    },
  });
}

export const createOrderTimelineIfMissing = addOrderTimelineOnce;
