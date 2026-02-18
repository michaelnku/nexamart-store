import { prisma } from "@/lib/prisma";
import { buildSellerNetByUser } from "@/lib/payout/escrowBreakdown";
import { Prisma } from "@/generated/prisma";

type ReleaseResult =
  | { success: true }
  | { skipped: true; reason: string };

type ReleaseEscrowOptions = {
  allowDisputedOrder?: boolean;
};

async function releaseEscrowPayoutWithTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: {
          select: {
            riderId: true,
            fee: true,
            status: true,
          },
        },
        sellerGroups: {
          select: {
            id: true,
            sellerId: true,
            subtotal: true,
            store: {
              select: {
                type: true,
              },
            },
          },
        },
      },
    });

  if (!order) return { skipped: true, reason: "ORDER_NOT_FOUND" };
  if (!order.isPaid) return { skipped: true, reason: "ORDER_NOT_PAID" };
  if (order.status !== "DELIVERED") {
    return { skipped: true, reason: "ORDER_NOT_DELIVERED" };
  }
  if (order.payoutReleased) {
    return { skipped: true, reason: "PAYOUT_ALREADY_RELEASED" };
  }
  if (order.disputeRaised && !options.allowDisputedOrder) {
    return { skipped: true, reason: "PAYOUT_SKIPPED_ACTIVE_DISPUTE" };
  }
  if (!order.delivery || !order.delivery.riderId) {
    return { skipped: true, reason: "MISSING_DELIVERY_OR_RIDER" };
  }
  if (order.delivery.status !== "DELIVERED") {
    return { skipped: true, reason: "DELIVERY_NOT_CONFIRMED" };
  }

  const existingPayoutTx = await tx.transaction.findFirst({
    where: {
      orderId,
      type: {
        in: ["SELLER_PAYOUT", "EARNING"],
      },
    },
    select: { id: true },
  });

  if (existingPayoutTx) {
    return { skipped: true, reason: "PAYOUT_TRANSACTION_EXISTS" };
  }

  const sellerNetByUserId = buildSellerNetByUser(order.sellerGroups);

  for (const [sellerId, sellerNet] of sellerNetByUserId) {
    const sellerWallet = await tx.wallet.upsert({
      where: { userId: sellerId },
      update: {},
      create: { userId: sellerId },
      select: { id: true },
    });

    await tx.wallet.update({
      where: { id: sellerWallet.id },
      data: {
        balance: { increment: sellerNet },
        pending: { decrement: sellerNet },
        totalEarnings: { increment: sellerNet },
      },
    });

    await tx.transaction.create({
      data: {
        walletId: sellerWallet.id,
        userId: sellerId,
        orderId,
        type: "SELLER_PAYOUT",
        amount: sellerNet,
        status: "SUCCESS",
        description: "Escrow payout release",
      },
    });
  }

  const riderWallet = await tx.wallet.upsert({
    where: { userId: order.delivery.riderId },
    update: {},
    create: { userId: order.delivery.riderId },
    select: { id: true },
  });

  const riderAmount = order.delivery.fee;
  await tx.wallet.update({
    where: { id: riderWallet.id },
    data: {
      balance: { increment: riderAmount },
      pending: { decrement: riderAmount },
      totalEarnings: { increment: riderAmount },
    },
  });

  await tx.transaction.create({
    data: {
      walletId: riderWallet.id,
      userId: order.delivery.riderId,
      orderId,
      type: "EARNING",
      amount: riderAmount,
      status: "SUCCESS",
      description: "Escrow payout release",
    },
  });

  await tx.orderSellerGroup.updateMany({
    where: { orderId },
    data: { payoutStatus: "COMPLETED" },
  });

  await tx.order.update({
    where: { id: orderId },
    data: {
      payoutReleased: true,
      status: "COMPLETED",
    },
  });

  return { success: true };
}

export async function releaseEscrowPayout(
  orderId: string,
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  return prisma.$transaction((tx) => releaseEscrowPayoutWithTx(tx, orderId, options));
}

export async function releaseEscrowPayoutInTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  options: ReleaseEscrowOptions = {},
): Promise<ReleaseResult> {
  return releaseEscrowPayoutWithTx(tx, orderId, options);
}
