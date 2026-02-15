"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { autoAssignRider } from "@/lib/rider/logistics";

export const acceptOrderAction = async (sellerGroupId: string) => {
  try {
    const group = await prisma.orderSellerGroup.update({
      where: { id: sellerGroupId },
      data: { status: "IN_TRANSIT_TO_HUB" },
      select: { orderId: true },
    });

    const remaining = await prisma.orderSellerGroup.count({
      where: {
        orderId: group.orderId,
        status: { not: "IN_TRANSIT_TO_HUB" },
      },
    });

    if (remaining === 0) {
      await autoAssignRider(group.orderId);
    }

    revalidatePath("/marketplace/dashboard/seller/orders");
    return { success: "Order accepted" };
  } catch (error) {
    console.error("acceptOrderAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to accept order",
    };
  }
};

export const shipOrderAction = async (sellerGroupId: string) => {
  try {
    const group = await prisma.orderSellerGroup.findUnique({
      where: { id: sellerGroupId },
      select: {
        id: true,
        orderId: true,
        status: true,
        items: {
          select: {
            variantId: true,
            quantity: true,
          },
        },
      },
    });

    if (!group) return { error: "Order group not found" };
    if (group.status !== "IN_TRANSIT_TO_HUB") {
      return { error: "Only in-transit orders can be marked as shipped" };
    }

    const variantQuantities = new Map<string, number>();
    for (const item of group.items) {
      if (!item.variantId) {
        throw new Error("Order item is missing variant information");
      }

      const current = variantQuantities.get(item.variantId) ?? 0;
      variantQuantities.set(item.variantId, current + item.quantity);
    }

    const remaining = await prisma.$transaction(async (tx) => {
      await tx.orderSellerGroup.update({
        where: { id: sellerGroupId },
        data: { status: "ARRIVED_AT_HUB" },
      });

      for (const [variantId, quantity] of variantQuantities.entries()) {
        const updated = await tx.productVariant.updateMany({
          where: { id: variantId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });

        if (updated.count !== 1) {
          throw new Error("One or more items are out of stock");
        }
      }

      return tx.orderSellerGroup.count({
        where: {
          orderId: group.orderId,
          status: { not: "ARRIVED_AT_HUB" },
        },
      });
    });

    if (remaining === 0) {
      await autoAssignRider(group.orderId);
    }

    revalidatePath("/marketplace/dashboard/seller/orders");
    return { success: "Order marked as shipped" };
  } catch (error) {
    console.error(error);
    return {
      error: error instanceof Error ? error.message : "Failed to update order",
    };
  }
};

export const cancelOrderAction = async (sellerGroupId: string) => {
  try {
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

    await prisma.$transaction(async (tx) => {
      await tx.orderSellerGroup.update({
        where: { id: sellerGroupId },
        data: { status: "CANCELLED" },
      });

      await tx.order.update({
        where: { id: group.orderId },
        data: { status: "CANCELLED" },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: group.orderId,
          status: "CANCELLED",
          message: "Order cancelled by seller",
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

      await tx.wallet.upsert({
        where: { userId: group.order.userId },
        update: {
          balance: { increment: group.subtotal + group.shippingFee },
          transactions: {
            create: {
              type: "REFUND",
              amount: group.subtotal + group.shippingFee,
              description: `Refund for cancelled order #${group.order.id}`,
            },
          },
        },
        create: {
          userId: group.order.userId,
          balance: group.subtotal + group.shippingFee,
          totalEarnings: 0,
          pending: 0,
          currency: "USD",
          transactions: {
            create: {
              type: "REFUND",
              amount: group.subtotal + group.shippingFee,
              description: `Refund for cancelled order #${group.order.id}`,
            },
          },
        },
      });
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

    return { success: "Order cancelled & refund issued" };
  } catch {
    return { error: "Failed to cancel order" };
  }
};
