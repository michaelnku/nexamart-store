"use server";

import { prisma } from "@/lib/prisma";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { getOrCreateSystemEscrowAccount } from "@/lib/ledger/systemEscrowWallet";

export async function handleAutoRefund(orderId: string) {
  const systemEscrowAccount = await getOrCreateSystemEscrowAccount();

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
    const wallet = await tx.wallet.upsert({
      where: { userId: order.userId },
      update: {},
      create: { userId: order.userId },
      select: { id: true },
    });
    if (!wallet) throw new Error("Wallet not found");

    await createEscrowEntryIdempotent(tx, {
      orderId: order.id,
      userId: order.userId,
      role: "BUYER",
      entryType: "REFUND",
      amount: order.totalAmount,
      status: "RELEASED",
      reference: `auto-refund-${order.id}`,
    });

    await createDoubleEntryLedger(tx, {
      orderId: order.id,
      fromWalletId: systemEscrowAccount.walletId,
      toUserId: order.userId,
      toWalletId: wallet.id,
      entryType: "REFUND",
      amount: order.totalAmount,
      reference: `ledger-auto-refund-${order.id}`,
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
