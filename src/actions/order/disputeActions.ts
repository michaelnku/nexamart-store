"use server";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { releaseEscrowPayoutInTx } from "@/lib/payout/releaseEscrowPayout";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

const FOOD_DISPUTE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const PRODUCT_DISPUTE_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

type Resolution = "REFUND_BUYER" | "RELEASE_SELLER" | "PARTIAL_REFUND";

export async function raiseOrderDisputeAction(orderId: string, reason: string) {
  const userId = await CurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const cleanReason = reason.trim();
  if (!cleanReason) throw new Error("Dispute reason is required");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        dispute: true,
        sellerGroups: { select: { id: true } },
        delivery: { select: { deliveredAt: true } },
      },
    });

    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) throw new Error("Forbidden");
    if (order.status !== "DELIVERED")
      throw new Error("Order must be delivered");
    if (order.dispute) throw new Error("Dispute already exists");
    if (!order.delivery?.deliveredAt)
      throw new Error("Missing delivery timestamp");

    const now = new Date();

    const disputeWindow = order.isFoodOrder
      ? FOOD_DISPUTE_WINDOW_MS
      : PRODUCT_DISPUTE_WINDOW_MS;

    if (now.getTime() > order.delivery.deliveredAt.getTime() + disputeWindow) {
      throw new Error("Dispute window expired");
    }

    const dispute = await tx.dispute.create({
      data: {
        orderId,
        openedById: userId,
        reason: "OTHER",
        description: cleanReason,
        status: "OPEN",
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        disputeId: dispute.id,
        status: "DISPUTED",
      },
    });

    await tx.orderSellerGroup.updateMany({
      where: { orderId },
      data: { payoutLocked: true },
    });

    await tx.delivery.updateMany({
      where: { orderId },
      data: { payoutLocked: true },
    });

    await tx.orderTimeline.create({
      data: {
        orderId,
        status: "DISPUTED",
        message: "Customer opened dispute",
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
          title: "New Dispute",
          message: `Dispute opened for order ${orderId}`,
        })),
      });
    }

    return { success: true };
  });
}

export async function resolveOrderDisputeAction(
  orderId: string,
  resolution: Resolution,
  partialAmount?: number,
) {
  const role = await CurrentRole();
  if (role !== "ADMIN") throw new Error("Forbidden");

  const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        dispute: true,
        sellerGroups: true,
      },
    });

    if (!order) throw new Error("Order not found");
    if (!order.dispute) throw new Error("No active dispute");

    const buyerWallet = await tx.wallet.upsert({
      where: { userId: order.userId },
      update: {},
      create: { userId: order.userId },
      select: { id: true },
    });

    if (resolution === "RELEASE_SELLER") {
      await tx.orderSellerGroup.updateMany({
        where: { orderId },
        data: { payoutLocked: false },
      });

      await tx.delivery.updateMany({
        where: { orderId },
        data: { payoutLocked: false },
      });

      const released = await releaseEscrowPayoutInTx(tx, orderId, {
        allowDisputedOrder: true,
      });

      if (
        "skipped" in released &&
        released.reason !== "PAYOUT_ALREADY_RELEASED"
      ) {
        throw new Error(`Unable to release payout: ${released.reason}`);
      }

      await tx.dispute.update({
        where: { id: order.dispute.id },
        data: {
          status: "RESOLVED",
          resolution: "RELEASE_TO_SELLER",
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          disputeId: null,
        },
      });

      return { success: true };
    }

    if (resolution === "REFUND_BUYER") {
      const amount = order.totalAmount;

      await createEscrowEntryIdempotent(tx, {
        orderId,
        userId: order.userId,
        role: "BUYER",
        entryType: "REFUND",
        amount,
        status: "RELEASED",
        reference: `refund-${orderId}`,
      });

      await createDoubleEntryLedger(tx, {
        orderId,
        fromWalletId: systemEscrowAccount.walletId,
        toUserId: order.userId,
        toWalletId: buyerWallet.id,
        entryType: "REFUND",
        amount,
        reference: `ledger-refund-${orderId}`,
      });

      await tx.transaction.create({
        data: {
          walletId: buyerWallet.id,
          userId: order.userId,
          orderId,
          type: "REFUND",
          amount,
          status: "SUCCESS",
        },
      });

      await tx.orderSellerGroup.updateMany({
        where: { orderId },
        data: {
          payoutStatus: "CANCELLED",
          payoutLocked: true,
        },
      });

      await tx.dispute.update({
        where: { id: order.dispute.id },
        data: {
          status: "RESOLVED",
          resolution: "REFUND_BUYER",
          refundAmount: amount,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "REFUNDED",
          disputeId: null,
        },
      });

      return { success: true };
    }

    if (resolution === "PARTIAL_REFUND") {
      if (!partialAmount || partialAmount <= 0)
        throw new Error("Invalid partial amount");

      if (partialAmount > order.totalAmount)
        throw new Error("Partial exceeds order");

      await createEscrowEntryIdempotent(tx, {
        orderId,
        userId: order.userId,
        role: "BUYER",
        entryType: "REFUND",
        amount: partialAmount,
        status: "RELEASED",
        reference: `partial-${orderId}`,
      });

      await createDoubleEntryLedger(tx, {
        orderId,
        fromWalletId: systemEscrowAccount.walletId,
        toUserId: order.userId,
        toWalletId: buyerWallet.id,
        entryType: "REFUND",
        amount: partialAmount,
        reference: `ledger-partial-${orderId}`,
      });

      await tx.orderSellerGroup.updateMany({
        where: { orderId },
        data: { payoutLocked: false },
      });

      await tx.delivery.updateMany({
        where: { orderId },
        data: { payoutLocked: false },
      });

      await releaseEscrowPayoutInTx(tx, orderId, {
        allowDisputedOrder: true,
      });

      await tx.dispute.update({
        where: { id: order.dispute.id },
        data: {
          status: "RESOLVED",
          resolution: "PARTIAL_REFUND",
          refundAmount: partialAmount,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          disputeId: null,
        },
      });

      return { success: true };
    }

    throw new Error("Invalid resolution");
  });
}
