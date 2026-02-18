import { PaymentMethod } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { autoAssignRider } from "@/lib/rider/logistics";
import { getOrCreateSystemEscrowWallet } from "@/lib/ledger/systemEscrowWallet";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";

const PLATFORM_COMMISSION_PERCENT = 12;
const PAYOUT_HOLD_MS = 24 * 60 * 60 * 1000;

export type PaymentMethodType = "CARD" | "WALLET";

export interface CompleteOrderPaymentParams {
  orderId: string;
  paymentReference: string;
  method: PaymentMethodType;
}

type CompleteOrderPaymentResult = {
  justPaid: boolean;
  order: {
    id: string;
    userId: string;
    totalAmount: number;
    sellerGroups: Array<{
      id: string;
      sellerId: string;
      storeId: string;
      subtotal: number;
      shippingFee: number;
    }>;
  };
};

export async function completeOrderPayment({
  orderId,
  paymentReference,
  method,
}: CompleteOrderPaymentParams): Promise<CompleteOrderPaymentResult> {
  if (!orderId || !paymentReference) {
    throw new Error("orderId and paymentReference are required");
  }

  const releaseAt = new Date(Date.now() + PAYOUT_HOLD_MS);
  const systemEscrowWalletId = await getOrCreateSystemEscrowWallet();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        isPaid: true,
        totalAmount: true,
        sellerGroups: {
          select: {
            id: true,
            sellerId: true,
            storeId: true,
            subtotal: true,
            shippingFee: true,
          },
        },
        delivery: {
          select: {
            id: true,
            riderId: true,
            fee: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const existingByReference = await tx.transaction.findUnique({
      where: { reference: paymentReference },
      select: { id: true },
    });
    if (existingByReference || order.isPaid) {
      return { justPaid: false, order };
    }

    if (order.sellerGroups.length === 0) {
      throw new Error("Order not properly initialized via placeOrderAction");
    }

    const buyerWallet =
      method === "WALLET"
        ? await tx.wallet.upsert({
            where: { userId: order.userId },
            update: {},
            create: { userId: order.userId, currency: "USD" },
            select: { id: true },
          })
        : null;

    if (method === "WALLET" && buyerWallet) {
      const ledgerTotals = await tx.ledgerEntry.groupBy({
        by: ["direction"],
        where: { walletId: buyerWallet.id },
        _sum: { amount: true },
      });

      const credit =
        ledgerTotals.find((item) => item.direction === "CREDIT")?._sum.amount ??
        0;
      const debit =
        ledgerTotals.find((item) => item.direction === "DEBIT")?._sum.amount ?? 0;
      const walletBalance = credit - debit;
      if (walletBalance < order.totalAmount) {
        throw new Error("Insufficient wallet balance");
      }
    }

    await tx.transaction.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        walletId: buyerWallet?.id,
        type: "ORDER_PAYMENT",
        amount: order.totalAmount,
        status: "SUCCESS",
        reference: paymentReference,
        description:
          method === "CARD" ? "Stripe order payment" : "Wallet order payment",
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        isPaid: true,
        status: "ACCEPTED",
        paymentMethod: method as PaymentMethod,
      },
    });

    await createEscrowEntryIdempotent(tx, {
      orderId: order.id,
      userId: order.userId,
      role: "BUYER",
      entryType: "FUND",
      amount: order.totalAmount,
      status: "HELD",
      reference: `escrow-fund-${order.id}`,
    });

    await createDoubleEntryLedger(tx, {
      orderId: order.id,
      fromUserId: order.userId,
      fromWalletId: buyerWallet?.id,
      toWalletId: systemEscrowWalletId,
      entryType: "ESCROW_DEPOSIT",
      amount: order.totalAmount,
      reference: `escrow-fund-${order.id}`,
      resolveFromWallet: method === "WALLET",
      resolveToWallet: false,
    });

    for (const group of order.sellerGroups) {
      const platformCommission =
        (group.subtotal * PLATFORM_COMMISSION_PERCENT) / 100;

      await createEscrowEntryIdempotent(tx, {
        orderId: order.id,
        userId: group.sellerId,
        role: "SELLER",
        entryType: "SELLER_EARNING",
        amount: group.subtotal,
        status: "HELD",
        reference: `seller-held-${group.id}`,
        metadata: { sellerGroupId: group.id, subtotal: group.subtotal },
      });

      await createEscrowEntryIdempotent(tx, {
        orderId: order.id,
        role: "PLATFORM",
        entryType: "PLATFORM_COMMISSION",
        amount: platformCommission,
        status: "HELD",
        reference: `platform-held-${group.id}`,
        metadata: {
          sellerGroupId: group.id,
          commissionPercent: PLATFORM_COMMISSION_PERCENT,
        },
      });
    }

    if (order.delivery) {
      await createEscrowEntryIdempotent(tx, {
        orderId: order.id,
        userId: order.delivery.riderId ?? undefined,
        role: "RIDER",
        entryType: "RIDER_EARNING",
        amount: order.delivery.fee,
        status: "HELD",
        reference: `rider-held-${order.id}`,
      });
    }

    await tx.orderSellerGroup.updateMany({
      where: { orderId: order.id, payoutEligibleAt: null },
      data: {
        payoutEligibleAt: releaseAt,
        payoutLocked: false,
      },
    });

    await tx.delivery.updateMany({
      where: { orderId: order.id, payoutEligibleAt: null },
      data: {
        payoutEligibleAt: releaseAt,
        payoutLocked: false,
      },
    });

    await tx.orderTimeline.create({
      data: {
        orderId: order.id,
        status: "ACCEPTED",
        message: `Payment confirmed via ${method}`,
      },
    });

    return { justPaid: true, order };
  });

  if (result.justPaid) {
    await autoAssignRider(orderId);
  }

  return result;
}
