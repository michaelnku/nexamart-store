import { prisma } from "@/lib/prisma";

export async function completeDeliveryAndPayRider(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
        sellerGroups: true,
      },
    });

    if (
      !order ||
      !order.delivery ||
      order.delivery.status !== "DELIVERED" ||
      order.status !== "DELIVERED" ||
      !order.isPaid ||
      order.payoutReleased
    ) {
      return { skipped: true };
    }

    // We intentionally block legacy payout release on active disputes
    // to keep escrow funds frozen until explicit admin resolution.
    if (order.disputeRaised) {
      return { skipped: true, reason: "PAYOUT_SKIPPED_ACTIVE_DISPUTE" };
    }

    const riderId = order.delivery.riderId!;
    const amount = order.delivery.fee;

    const wallet = await tx.wallet.upsert({
      where: { userId: riderId },
      update: {},
      create: { userId: riderId },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        totalEarnings: { increment: amount },
      },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId: riderId,
        orderId,
        type: "EARNING",
        amount,
        status: "SUCCESS",
        description: "Delivery payout",
      },
    });

    await tx.riderProfile.update({
      where: { userId: riderId },
      data: { isAvailable: true },
    });

    await tx.orderSellerGroup.updateMany({
      where: { orderId },
      data: { payoutStatus: "COMPLETED" },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        payoutReleased: true,
      },
    });

    await tx.orderTimeline.create({
      data: {
        orderId,
        status: "COMPLETED",
        message: "Order completed and payouts released",
      },
    });

    return { success: true };
  });
}
