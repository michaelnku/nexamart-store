"use server";

import { prisma } from "@/lib/prisma";
import { creditBuyerWalletRefundInTx } from "@/lib/refunds/creditBuyerWalletRefund";

export async function handleAutoRefund(orderId: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        totalAmount: true,
        status: true,
      },
    });

    if (!order) throw new Error("Order not found");

    // Only allow refund for CANCELLED or RETURNED orders
    if (order.status !== "CANCELLED" && order.status !== "RETURNED") {
      throw new Error("Refund cannot be processed for this order");
    }

    // Avoid repeated refunds
    const existingRefund = await tx.transaction.findFirst({
      where: { orderId: order.id, type: "REFUND" },
    });
    if (existingRefund) throw new Error("Refund already processed");

    await creditBuyerWalletRefundInTx(tx, {
      orderId: order.id,
      buyerUserId: order.userId,
      amount: order.totalAmount,
      reference: `auto-refund-${order.id}`,
      description: `Refund for order ${order.id}`,
    });

    return { success: true };
  });
}
