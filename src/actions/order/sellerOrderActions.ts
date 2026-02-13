//sellerOrderActions.ts
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
    await prisma.orderSellerGroup.update({
      where: { id: sellerGroupId },
      data: { status: "ARRIVED_AT_HUB" },
    });
    revalidatePath("/marketplace/dashboard/seller/orders");
    return { success: "Order marked as shipped" };
  } catch {
    return { error: "Failed to update order" };
  }
};

export const cancelOrderAction = async (sellerGroupId: string) => {
  try {
    const group = await prisma.orderSellerGroup.update({
      where: { id: sellerGroupId },
      data: { status: "CANCELLED" },
      include: { order: true },
    });

    await prisma.wallet.update({
      where: { userId: group.order.userId },
      data: {
        balance: { increment: group.subtotal + group.shippingFee },
        transactions: {
          create: {
            type: "REFUND",
            amount: group.subtotal + group.shippingFee,
            description: `Refund for cancelled order #${group.order.id}`,
          },
        },
      },
    });

    revalidatePath("/marketplace/dashboard/seller/orders");
    return { success: "Order cancelled & refund issued" };
  } catch {
    return { error: "Failed to cancel order" };
  }
};
