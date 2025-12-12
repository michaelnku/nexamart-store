"use server";

import { prisma } from "@/lib/prisma";

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

    // Get buyer wallet
    const wallet = await tx.wallet.findUnique({
      where: { userId: order.userId },
      select: { id: true },
    });
    if (!wallet) throw new Error("Wallet not found");

    // Credit wallet
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: order.totalAmount } },
    });

    // Transaction record
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        orderId: order.id,
        userId: order.userId,
        amount: order.totalAmount,
        type: "REFUND",
        status: "SUCCESS",
        description: `Refund for order ${order.id}`,
      },
    });

    return { success: true };
  });
}
