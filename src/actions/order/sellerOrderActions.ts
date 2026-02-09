"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const acceptOrderAction = async (sellerGroupId: string) => {
  try {
    await prisma.orderSellerGroup.update({
      where: { id: sellerGroupId },
      data: { status: "IN_TRANSIT_TO_HUB" },
    });
    revalidatePath("/marketplace/dashboard/seller/orders");
    return { success: "Order accepted" };
  } catch {
    return { error: "Failed to accept order" };
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

    // Refund buyer automatically
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
