"use server";

import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { releaseEscrowPayoutInTx } from "@/lib/payout/releaseEscrowPayout";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

const DISPUTE_WINDOW_MS = 24 * 60 * 60 * 1000;

type Resolution = "REFUND_BUYER" | "RELEASE_SELLER" | "PARTIAL_REFUND";
type AdminOutcome = "RELEASE" | "REFUND";

export async function raiseOrderDisputeAction(orderId: string, reason: string) {
  const userId = await CurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const cleanReason = reason.trim();
  if (!cleanReason) throw new Error("Dispute reason is required");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        disputeRaised: true,
        customerConfirmedAt: true,
      },
    });

    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) throw new Error("Forbidden");
    if (order.status !== "DELIVERED") throw new Error("Order must be delivered");
    if (order.disputeRaised) throw new Error("Dispute already raised");
    if (!order.customerConfirmedAt) throw new Error("Missing delivery timestamp");

    const now = new Date();
    if (now.getTime() > order.customerConfirmedAt.getTime() + DISPUTE_WINDOW_MS) {
      throw new Error("Dispute window expired");
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        disputeRaised: true,
        disputeReason: cleanReason,
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
          title: "New Dispute Raised",
          message: `Customer raised dispute for order ${orderId}`,
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
        sellerGroups: {
          select: {
            id: true,
            sellerId: true,
            payoutStatus: true,
          },
        },
      },
    });

    if (!order) throw new Error("Order not found");
    if (!order.isPaid) throw new Error("Order is not paid");
    if (!order.disputeRaised) throw new Error("No active dispute");
    if (order.payoutReleased) throw new Error("Payout already released");

    if (resolution === "RELEASE_SELLER") {
      const released = await releaseEscrowPayoutInTx(tx, orderId, {
        allowDisputedOrder: true,
      });
      if ("skipped" in released && released.reason !== "PAYOUT_ALREADY_RELEASED") {
        throw new Error(`Unable to release payout: ${released.reason}`);
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
          message: "Dispute resolved: seller payout released by admin",
        },
      });

      return { success: true };
    }

    const buyerWallet = await tx.wallet.upsert({
      where: { userId: order.userId },
      update: {},
      create: { userId: order.userId },
      select: { id: true },
    });

    if (resolution === "REFUND_BUYER") {
      await createEscrowEntryIdempotent(tx, {
        orderId,
        userId: order.userId,
        role: "BUYER",
        entryType: "REFUND",
        amount: order.totalAmount,
        status: "RELEASED",
        reference: `refund-buyer-${orderId}`,
      });

      await createDoubleEntryLedger(tx, {
        orderId,
        fromWalletId: systemEscrowAccount.walletId,
        toUserId: order.userId,
        toWalletId: buyerWallet.id,
        entryType: "REFUND",
        amount: order.totalAmount,
        reference: `ledger-refund-buyer-${orderId}`,
      });

      await tx.transaction.create({
        data: {
          walletId: buyerWallet.id,
          userId: order.userId,
          orderId,
          type: "REFUND",
          amount: order.totalAmount,
          status: "SUCCESS",
          description: "Admin dispute refund",
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
          message: "Dispute resolved: buyer fully refunded by admin",
        },
      });

      return { success: true };
    }

    if (resolution === "PARTIAL_REFUND") {
      if (typeof partialAmount !== "number" || partialAmount <= 0) {
        throw new Error("partialAmount is required and must be > 0");
      }
      if (partialAmount > order.totalAmount) {
        throw new Error("partialAmount cannot exceed totalAmount");
      }

      await createEscrowEntryIdempotent(tx, {
        orderId,
        userId: order.userId,
        role: "BUYER",
        entryType: "REFUND",
        amount: partialAmount,
        status: "RELEASED",
        reference: `partial-refund-buyer-${orderId}`,
      });

      await createDoubleEntryLedger(tx, {
        orderId,
        fromWalletId: systemEscrowAccount.walletId,
        toUserId: order.userId,
        toWalletId: buyerWallet.id,
        entryType: "REFUND",
        amount: partialAmount,
        reference: `ledger-partial-refund-buyer-${orderId}`,
      });

      await tx.transaction.create({
        data: {
          walletId: buyerWallet.id,
          userId: order.userId,
          orderId,
          type: "REFUND",
          amount: partialAmount,
          status: "SUCCESS",
          description: "Admin dispute partial refund",
        },
      });

      const released = await releaseEscrowPayoutInTx(tx, orderId, {
        allowDisputedOrder: true,
      });
      if ("skipped" in released && released.reason !== "PAYOUT_ALREADY_RELEASED") {
        throw new Error(`Unable to release remaining payout: ${released.reason}`);
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          disputeRaised: false,
          disputeReason: null,
          disputeRaisedAt: null,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: "COMPLETED",
          message: `Dispute resolved: partial refund ${partialAmount.toFixed(2)} and seller release`,
        },
      });

      return { success: true };
    }

    throw new Error("Invalid dispute resolution");
  });
}

export async function resolveDispute(orderId: string, outcome: AdminOutcome) {
  const mapped: Resolution =
    outcome === "RELEASE" ? "RELEASE_SELLER" : "REFUND_BUYER";
  return resolveOrderDisputeAction(orderId, mapped);
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
    const sellerMap = new Map<
      string,
      { id: string; name: string | null; email: string }
    >();
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
