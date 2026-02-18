"use server";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { buildSellerNetByUser } from "@/lib/payout/escrowBreakdown";
import { releaseEscrowPayoutInTx } from "@/lib/payout/releaseEscrowPayout";

const DISPUTE_WINDOW_MS = 24 * 60 * 60 * 1000;

type DisputeResolution = "REFUND_BUYER" | "RELEASE_SELLER" | "PARTIAL_REFUND";

function normalizeReason(reason: string): string {
  return reason.trim();
}

export async function raiseOrderDisputeAction(orderId: string, reason: string) {
  const userId = await CurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const normalizedReason = normalizeReason(reason);
  if (!normalizedReason) throw new Error("Dispute reason is required");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        customerConfirmedAt: true,
        disputeRaised: true,
      },
    });

    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) throw new Error("Forbidden");
    if (order.status !== "DELIVERED") {
      throw new Error("Only delivered orders can be disputed");
    }
    if (order.disputeRaised) throw new Error("Dispute already raised");
    if (!order.customerConfirmedAt) {
      throw new Error("Delivery confirmation timestamp is missing");
    }

    const now = new Date();
    const windowEnds = new Date(order.customerConfirmedAt.getTime() + DISPUTE_WINDOW_MS);
    if (now > windowEnds) {
      throw new Error("Dispute window has expired");
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        disputeRaised: true,
        disputeReason: normalizedReason,
        disputeRaisedAt: now,
      },
    });

    await tx.orderTimeline.create({
      data: {
        orderId,
        status: "DELIVERED",
        message: "Dispute raised by customer",
      },
    });

    const admins = await tx.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await tx.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Order Dispute Raised",
          message: `Dispute raised for order ${orderId}`,
        })),
      });
    }

    return { success: true };
  });
}

async function processRefundBuyer(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: {
          select: {
            riderId: true,
            fee: true,
          },
        },
        sellerGroups: {
          select: {
            sellerId: true,
            subtotal: true,
            store: {
              select: { type: true },
            },
          },
        },
      },
    });

    if (!order) throw new Error("Order not found");
    if (!order.isPaid) throw new Error("Order is not paid");
    if (!order.disputeRaised) throw new Error("No active dispute on this order");
    if (order.payoutReleased) throw new Error("Payout already released");

    const existingRefund = await tx.transaction.findFirst({
      where: { orderId, type: "REFUND" },
      select: { id: true },
    });
    if (existingRefund) return { success: true };

    const buyerWallet = await tx.wallet.upsert({
      where: { userId: order.userId },
      update: {},
      create: { userId: order.userId },
      select: { id: true },
    });

    const sellerNetByUserId = buildSellerNetByUser(order.sellerGroups);
    for (const [sellerId, sellerNet] of sellerNetByUserId) {
      const sellerWallet = await tx.wallet.upsert({
        where: { userId: sellerId },
        update: {},
        create: { userId: sellerId },
        select: { id: true, pending: true },
      });

      // Roll back seller escrow pending to avoid future payout release.
      const decrementAmount = Math.min(sellerWallet.pending, sellerNet);
      if (decrementAmount > 0) {
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: { pending: { decrement: decrementAmount } },
        });
      }
    }

    if (order.delivery?.riderId) {
      const riderWallet = await tx.wallet.upsert({
        where: { userId: order.delivery.riderId },
        update: {},
        create: { userId: order.delivery.riderId },
        select: { id: true, pending: true },
      });

      // We block rider release during active dispute to preserve full escrow integrity.
      const riderDecrement = Math.min(riderWallet.pending, order.delivery.fee);
      if (riderDecrement > 0) {
        await tx.wallet.update({
          where: { id: riderWallet.id },
          data: { pending: { decrement: riderDecrement } },
        });
      }
    }

    await tx.wallet.update({
      where: { id: buyerWallet.id },
      data: { balance: { increment: order.totalAmount } },
    });

    await tx.transaction.create({
      data: {
        walletId: buyerWallet.id,
        orderId,
        userId: order.userId,
        amount: order.totalAmount,
        type: "REFUND",
        status: "SUCCESS",
        description: "Admin dispute resolution refund",
      },
    });

    await tx.orderSellerGroup.updateMany({
      where: { orderId },
      data: { payoutStatus: "CANCELLED" },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "REFUNDED",
        payoutReleased: true,
        disputeRaised: false,
        disputeReason: null,
        disputeRaisedAt: null,
      },
    });

    await tx.orderTimeline.create({
      data: {
        orderId,
        status: "REFUNDED",
        message: "Dispute resolved: buyer refunded by admin",
      },
    });

    return { success: true };
  });
}

async function processPartialRefund(orderId: string, partialAmount: number) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        totalAmount: true,
        isPaid: true,
        disputeRaised: true,
        payoutReleased: true,
      },
    });

    if (!order) throw new Error("Order not found");
    if (!order.isPaid) throw new Error("Order is not paid");
    if (!order.disputeRaised) throw new Error("No active dispute on this order");
    if (order.payoutReleased) throw new Error("Payout already released");
    if (partialAmount <= 0) throw new Error("partialAmount must be greater than 0");
    if (partialAmount > order.totalAmount) {
      throw new Error("partialAmount cannot exceed order total amount");
    }

    const existingRefund = await tx.transaction.findFirst({
      where: { orderId, type: "REFUND" },
      select: { id: true },
    });
    if (existingRefund) return { success: true };

    const buyerWallet = await tx.wallet.upsert({
      where: { userId: order.userId },
      update: {},
      create: { userId: order.userId },
      select: { id: true },
    });

    // First credit buyer partial refund.
    await tx.wallet.update({
      where: { id: buyerWallet.id },
      data: { balance: { increment: partialAmount } },
    });

    await tx.transaction.create({
      data: {
        walletId: buyerWallet.id,
        orderId,
        userId: order.userId,
        amount: partialAmount,
        type: "REFUND",
        status: "SUCCESS",
        description: "Admin dispute resolution partial refund",
      },
    });

    // Then release remaining escrow to sellers/rider from the same transaction.
    const releaseResult = await releaseEscrowPayoutInTx(tx, orderId, {
      allowDisputedOrder: true,
    });
    if ("skipped" in releaseResult && releaseResult.reason !== "PAYOUT_ALREADY_RELEASED") {
      throw new Error(`Unable to release seller payout: ${releaseResult.reason}`);
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        disputeRaised: false,
        disputeReason: null,
        disputeRaisedAt: null,
        status: "COMPLETED",
      },
    });

    await tx.orderTimeline.create({
      data: {
        orderId,
        status: "COMPLETED",
        message: `Dispute resolved: partial refund of ${partialAmount.toFixed(2)} and seller release`,
      },
    });

    return { success: true };
  });
}

export async function resolveOrderDisputeAction(
  orderId: string,
  resolution: DisputeResolution,
  partialAmount?: number,
) {
  const role = await CurrentRole();
  if (role !== "ADMIN") throw new Error("Forbidden");

  if (resolution === "REFUND_BUYER") {
    return processRefundBuyer(orderId);
  }

  if (resolution === "RELEASE_SELLER") {
    await prisma.$transaction(async (tx) => {
      const result = await releaseEscrowPayoutInTx(tx, orderId, {
        allowDisputedOrder: true,
      });
      if ("skipped" in result && result.reason !== "PAYOUT_ALREADY_RELEASED") {
        throw new Error(`Unable to release payout: ${result.reason}`);
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          disputeRaised: false,
          disputeReason: null,
          disputeRaisedAt: null,
          status: "COMPLETED",
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: "COMPLETED",
          message: "Dispute resolved: payout released to seller by admin",
        },
      });
    });

    return { success: true };
  }

  if (resolution === "PARTIAL_REFUND") {
    if (typeof partialAmount !== "number") {
      throw new Error("partialAmount is required for PARTIAL_REFUND");
    }
    return processPartialRefund(orderId, partialAmount);
  }

  throw new Error("Invalid dispute resolution");
}

export async function getDisputedOrdersAction() {
  const role = await CurrentRole();
  if (role !== "ADMIN") throw new Error("Forbidden");

  const orders = await prisma.order.findMany({
    where: { disputeRaised: true },
    orderBy: { disputeRaisedAt: "desc" },
    select: {
      id: true,
      totalAmount: true,
      disputeReason: true,
      disputeRaisedAt: true,
      status: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sellerGroups: {
        select: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return orders.map((order) => {
    const sellerMap = new Map<string, { id: string; name: string | null; email: string }>();
    for (const group of order.sellerGroups) {
      sellerMap.set(group.seller.id, group.seller);
    }

    return {
      orderId: order.id,
      customer: order.customer,
      seller: [...sellerMap.values()],
      totalAmount: order.totalAmount,
      disputeReason: order.disputeReason,
      disputeRaisedAt: order.disputeRaisedAt,
      status: order.status,
    };
  });
}
