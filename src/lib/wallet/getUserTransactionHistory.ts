import { TransactionStatus, TransactionType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { WalletTransaction } from "@/lib/types";

type TransactionHistoryRole = "seller" | "rider";

export type TransactionHistoryItem = WalletTransaction & {
  orderId?: string | null;
  source: "transaction" | "pending-payout";
  activityAt: Date;
  eligibleAt?: Date | null;
  deliveredAt?: Date | null;
};

type GetUserTransactionHistoryInput = {
  userId: string;
  role: TransactionHistoryRole;
  limit?: number;
};

const FINAL_PAYOUT_STATUSES: TransactionStatus[] = [
  "SUCCESS",
  "FAILED",
  "CANCELLED",
];

function sortHistoryItems(
  a: TransactionHistoryItem,
  b: TransactionHistoryItem,
): number {
  return b.activityAt.getTime() - a.activityAt.getTime();
}

function normalizeTransactionItem(transaction: {
  id: string;
  orderId: string | null;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string | null;
  description: string | null;
  createdAt: Date;
}): TransactionHistoryItem {
  return {
    id: transaction.id,
    orderId: transaction.orderId,
    type: transaction.type,
    amount: transaction.amount,
    status: transaction.status,
    reference: transaction.reference,
    description: transaction.description,
    createdAt: transaction.createdAt,
    activityAt: transaction.createdAt,
    source: "transaction",
  };
}

async function getSellerTransactionHistory(
  userId: string,
  limit: number,
): Promise<TransactionHistoryItem[]> {
  const payoutType: TransactionType = "SELLER_PAYOUT";
  const rawTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: [payoutType, "WITHDRAWAL"] },
    },
    orderBy: { createdAt: "desc" },
    take: Math.max(limit * 3, 100),
    select: {
      id: true,
      orderId: true,
      type: true,
      amount: true,
      status: true,
      reference: true,
      description: true,
      createdAt: true,
    },
  });

  const finalizedPayoutReferences = new Set(
    rawTransactions
      .filter(
        (transaction) =>
          transaction.type === payoutType &&
          FINAL_PAYOUT_STATUSES.includes(transaction.status) &&
          transaction.reference,
      )
      .map((transaction) => transaction.reference as string),
  );

  const postedTransactions = rawTransactions
    .filter(
      (transaction) =>
        transaction.type !== payoutType || transaction.status !== "PENDING",
    )
    .map(normalizeTransactionItem);

  const pendingSellerGroups = await prisma.orderSellerGroup.findMany({
    where: {
      sellerId: userId,
      sellerRevenue: { gt: 0 },
      payoutReleasedAt: null,
      payoutStatus: { notIn: ["COMPLETED", "CANCELLED"] },
      order: {
        isPaid: true,
        status: { in: ["DELIVERED", "DISPUTED"] },
      },
    },
    select: {
      id: true,
      orderId: true,
      sellerRevenue: true,
      createdAt: true,
      payoutEligibleAt: true,
      order: {
        select: {
          delivery: {
            select: {
              deliveredAt: true,
            },
          },
        },
      },
    },
  });

  const derivedPendingItems: TransactionHistoryItem[] = pendingSellerGroups
    .filter(
      (group) => !finalizedPayoutReferences.has(`pending-seller-${group.id}`),
    )
    .map((group) => {
      const deliveredAt = group.order.delivery?.deliveredAt ?? null;
      const activityAt =
        deliveredAt ?? group.payoutEligibleAt ?? group.createdAt;

      return {
        id: `pending-seller-${group.id}`,
        orderId: group.orderId,
        type: "SELLER_PAYOUT",
        amount: group.sellerRevenue,
        status: "PENDING",
        reference: `pending-seller-${group.id}`,
        description: `Payout pending release for order ${group.orderId}`,
        createdAt: group.createdAt,
        activityAt,
        eligibleAt: group.payoutEligibleAt,
        deliveredAt,
        source: "pending-payout",
      };
    });

  return [...postedTransactions, ...derivedPendingItems]
    .sort(sortHistoryItems)
    .slice(0, limit);
}

async function getRiderTransactionHistory(
  userId: string,
  limit: number,
): Promise<TransactionHistoryItem[]> {
  const payoutType: TransactionType = "RIDER_PAYOUT";
  const rawTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: [payoutType, "WITHDRAWAL"] },
    },
    orderBy: { createdAt: "desc" },
    take: Math.max(limit * 3, 100),
    select: {
      id: true,
      orderId: true,
      type: true,
      amount: true,
      status: true,
      reference: true,
      description: true,
      createdAt: true,
    },
  });

  const finalizedPayoutReferences = new Set(
    rawTransactions
      .filter(
        (transaction) =>
          transaction.type === payoutType &&
          FINAL_PAYOUT_STATUSES.includes(transaction.status) &&
          transaction.reference,
      )
      .map((transaction) => transaction.reference as string),
  );

  const postedTransactions = rawTransactions
    .filter(
      (transaction) =>
        transaction.type !== payoutType || transaction.status !== "PENDING",
    )
    .map(normalizeTransactionItem);

  const pendingDeliveries = await prisma.delivery.findMany({
    where: {
      riderId: userId,
      status: "DELIVERED",
      fee: { gt: 0 },
      payoutReleasedAt: null,
      order: {
        isPaid: true,
      },
    },
    select: {
      id: true,
      orderId: true,
      fee: true,
      assignedAt: true,
      deliveredAt: true,
      payoutEligibleAt: true,
    },
  });

  const derivedPendingItems: TransactionHistoryItem[] = pendingDeliveries
    .filter(
      (delivery) =>
        !finalizedPayoutReferences.has(`pending-rider-${delivery.orderId}`),
    )
    .map((delivery) => {
      const createdAt =
        delivery.assignedAt ??
        delivery.deliveredAt ??
        delivery.payoutEligibleAt ??
        new Date(0);
      const activityAt =
        delivery.deliveredAt ?? delivery.payoutEligibleAt ?? createdAt;

      return {
        id: `pending-rider-${delivery.id}`,
        orderId: delivery.orderId,
        type: "RIDER_PAYOUT",
        amount: delivery.fee,
        status: "PENDING",
        reference: `pending-rider-${delivery.orderId}`,
        description: `Payout pending release for order ${delivery.orderId}`,
        createdAt,
        activityAt,
        eligibleAt: delivery.payoutEligibleAt,
        deliveredAt: delivery.deliveredAt,
        source: "pending-payout",
      };
    });

  return [...postedTransactions, ...derivedPendingItems]
    .sort(sortHistoryItems)
    .slice(0, limit);
}

export async function getUserTransactionHistory({
  userId,
  role,
  limit = 50,
}: GetUserTransactionHistoryInput): Promise<TransactionHistoryItem[]> {
  if (role === "seller") {
    return getSellerTransactionHistory(userId, limit);
  }

  return getRiderTransactionHistory(userId, limit);
}
