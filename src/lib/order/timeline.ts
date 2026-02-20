import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type TimelineStatus =
  | "PENDING"
  | "ACCEPTED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

type Tx = Prisma.TransactionClient;

export async function addOrderTimelineOnce(
  params: {
    orderId: string;
    status: TimelineStatus;
    message: string;
  },
  tx?: Tx,
) {
  const db = tx ?? prisma;

  const existing = await db.orderTimeline.findFirst({
    where: {
      orderId: params.orderId,
      status: params.status,
      message: params.message,
    },
    select: { id: true },
  });

  if (existing) return;

  await db.orderTimeline.create({
    data: {
      orderId: params.orderId,
      status: params.status,
      message: params.message,
    },
  });
}

export const createOrderTimelineIfMissing = addOrderTimelineOnce;
