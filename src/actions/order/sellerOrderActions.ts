"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { CurrentRole, CurrentUserId } from "@/lib/currentUser";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";

export const markSellerDispatchedToHubAction = async (
  sellerGroupId: string,
) => {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "SELLER") return { error: "Forbidden" };

  try {
    const sellerGroup = await prisma.orderSellerGroup.findUnique({
      where: { id: sellerGroupId },
      select: {
        id: true,
        orderId: true,
        sellerId: true,
        status: true,
        store: {
          select: { name: true },
        },
        order: {
          select: { isFoodOrder: true },
        },
      },
    });

    if (!sellerGroup) return { error: "Order group not found" };
    if (sellerGroup.sellerId !== userId) return { error: "Forbidden" };
    if (sellerGroup.order.isFoodOrder) {
      return { error: "Food orders do not use hub dispatch flow." };
    }
    if (sellerGroup.status === "ARRIVED_AT_HUB") {
      return { error: "Group already marked as arrived at hub." };
    }
    if (sellerGroup.status === "CANCELLED") {
      return { error: "Cannot dispatch a cancelled order group." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderSellerGroup.update({
        where: { id: sellerGroupId },
        data: {
          status: "IN_TRANSIT_TO_HUB",
          expectedAtHub: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });

      await createOrderTimelineIfMissing(
        {
          orderId: sellerGroup.orderId,
          status: "SHIPPED",
          message: `Seller ${sellerGroup.store.name} has dispatched items to our hub.`,
        },
        tx,
      );
    });

    revalidatePath("/marketplace/dashboard/seller/orders");
    revalidatePath(
      `/marketplace/dashboard/seller/orders/${sellerGroup.orderId}`,
    );
    return { success: "Package dispatched to hub" };
  } catch (error) {
    console.error("markSellerDispatchedToHubAction error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to dispatch package to hub",
    };
  }
};

export const acceptOrderAction = async (sellerGroupId: string) => {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const role = await CurrentRole();
  if (role !== "SELLER") return { error: "Forbidden" };

  try {
    const group = await prisma.orderSellerGroup.findUnique({
      where: { id: sellerGroupId },
      select: {
        id: true,
        sellerId: true,
        store: { select: { name: true } },
        status: true,
        orderId: true,
        order: {
          select: {
            isFoodOrder: true,
          },
        },
      },
    });

    if (!group) return { error: "Order group not found" };
    if (group.sellerId !== userId) return { error: "Forbidden" };

    if (group.status !== "PENDING_PICKUP") {
      return { error: "Order already processed." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderSellerGroup.update({
        where: { id: sellerGroupId },
        data: {
          status: "ACCEPTED",
        },
      });

      await createOrderTimelineIfMissing(
        {
          orderId: group.orderId,
          status: "ACCEPTED",
          message: `Seller ${group.store.name} accepted and is preparing your items.`,
        },
        tx,
      );
    });

    return { success: "Order accepted" };
  } catch (error) {
    return { error: "Failed to accept order" };
  }
};

export const shipOrderAction = async (sellerGroupId: string) => {
  return markSellerDispatchedToHubAction(sellerGroupId);
};

export const cancelOrderAction = async (sellerGroupId: string) => {
  try {
    const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

    const group = await prisma.orderSellerGroup.findUnique({
      where: { id: sellerGroupId },
      include: {
        order: {
          include: {
            delivery: {
              select: { id: true, riderId: true, status: true },
            },
          },
        },
      },
    });

    if (!group) return { error: "Order group not found" };

    if (group.status === "CANCELLED") {
      return { error: "Order group already cancelled." };
    }

    if (
      !["PENDING_PICKUP", "ACCEPTED", "IN_TRANSIT_TO_HUB"].includes(
        group.status,
      )
    ) {
      return { error: "Cannot cancel at this stage." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderSellerGroup.update({
        where: { id: sellerGroupId },
        data: { status: "CANCELLED" },
      });

      const refundAmount = group.subtotal + group.shippingFee;

      const buyerWallet = await tx.wallet.upsert({
        where: { userId: group.order.userId },
        update: {},
        create: {
          userId: group.order.userId,
          currency: "USD",
        },
        select: { id: true },
      });

      await createEscrowEntryIdempotent(tx, {
        orderId: group.orderId,
        userId: group.order.userId,
        role: "BUYER",
        entryType: "REFUND",
        amount: refundAmount,
        status: "RELEASED",
        reference: `seller-cancel-refund-${group.id}`,
      });

      await createDoubleEntryLedger(tx, {
        orderId: group.orderId,
        fromWalletId: systemEscrowAccount.walletId,
        toUserId: group.order.userId,
        toWalletId: buyerWallet.id,
        entryType: "REFUND",
        amount: refundAmount,
        reference: `seller-cancel-refund-ledger-${group.id}`,
      });

      await tx.transaction.create({
        data: {
          walletId: buyerWallet.id,
          orderId: group.orderId,
          userId: group.order.userId,
          type: "REFUND",
          amount: refundAmount,
          status: "SUCCESS",
          reference: `tx-seller-cancel-refund-${group.id}`,
          description: `Refund for cancelled items from seller group`,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: group.orderId,
          status: group.order.status,
          message: `One seller cancelled their items. Refund issued.`,
        },
      });

      const remainingActiveGroups = await tx.orderSellerGroup.count({
        where: {
          orderId: group.orderId,
          status: { not: "CANCELLED" },
        },
      });

      if (remainingActiveGroups === 0) {
        await tx.order.update({
          where: { id: group.orderId },
          data: { status: "CANCELLED" },
        });

        await tx.orderTimeline.create({
          data: {
            orderId: group.orderId,
            status: "CANCELLED",
            message: "All seller items cancelled. Order fully cancelled.",
          },
        });

        if (group.order.delivery) {
          await tx.delivery.update({
            where: { id: group.order.delivery.id },
            data: { status: "CANCELLED" },
          });

          if (group.order.delivery.riderId) {
            await tx.riderProfile.updateMany({
              where: { userId: group.order.delivery.riderId },
              data: { isAvailable: true },
            });
          }
        }
      }
    });

    revalidatePath("/marketplace/dashboard/seller/orders");
    revalidatePath(`/marketplace/dashboard/seller/orders/${group.orderId}`);
    revalidatePath("/marketplace/dashboard/rider/deliveries");
    revalidatePath("/customer/order/history");
    revalidatePath(`/customer/order/${group.orderId}`);
    revalidatePath(`/customer/order/track/${group.orderId}`);

    if (group.order.trackingNumber) {
      revalidatePath(`/customer/order/track/tn/${group.order.trackingNumber}`);
    }

    revalidatePath("/");

    return { success: "Seller items cancelled & refund issued" };
  } catch (error) {
    console.error("cancelOrderAction error:", error);
    return { error: "Failed to cancel order" };
  }
};
