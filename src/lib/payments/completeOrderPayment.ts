import { PaymentMethod } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { autoAssignRider } from "@/lib/rider/logistics";
import { getOrCreateSystemEscrowWallet } from "@/lib/ledger/systemEscrowWallet";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { ServiceContext } from "@/lib/system/serviceContext";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";

const PLATFORM_COMMISSION_PERCENT = 12;
const PAYOUT_HOLD_MS = 24 * 60 * 60 * 1000;

export type PaymentMethodType = "CARD" | "WALLET";

export interface CompleteOrderPaymentParams {
  orderId: string;
  paymentReference: string;
  method: PaymentMethodType;
  context?: ServiceContext;
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

async function finalizePostPayment(
  order: CompleteOrderPaymentResult["order"],
  context?: ServiceContext,
): Promise<void> {
  const releaseAt = new Date(Date.now() + PAYOUT_HOLD_MS);

  const freshOrder = await prisma.order.findUnique({
    where: { id: order.id },
    select: {
      id: true,
      paymentMethod: true,
      isFoodOrder: true,
      postPaymentFinalized: true,
      sellerGroups: {
        select: {
          id: true,
          sellerId: true,
          subtotal: true,
        },
      },
      delivery: {
        select: {
          riderId: true,
          fee: true,
        },
      },
    },
  });

  if (!freshOrder || freshOrder.postPaymentFinalized) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const group of freshOrder.sellerGroups) {
      const platformCommission =
        (group.subtotal * PLATFORM_COMMISSION_PERCENT) / 100;

      await createEscrowEntryIdempotent(tx, {
        orderId: freshOrder.id,
        userId: group.sellerId,
        role: "SELLER",
        entryType: "SELLER_EARNING",
        amount: group.subtotal,
        status: "HELD",
        reference: `seller-held-${group.id}`,
        metadata: { sellerGroupId: group.id, subtotal: group.subtotal },
        context,
      });

      await createEscrowEntryIdempotent(tx, {
        orderId: freshOrder.id,
        role: "PLATFORM",
        entryType: "PLATFORM_COMMISSION",
        amount: platformCommission,
        status: "HELD",
        reference: `platform-held-${group.id}`,
        metadata: {
          sellerGroupId: group.id,
          commissionPercent: PLATFORM_COMMISSION_PERCENT,
        },
        context,
      });
    }

    if (freshOrder.delivery) {
      await createEscrowEntryIdempotent(tx, {
        orderId: freshOrder.id,
        userId: freshOrder.delivery.riderId ?? undefined,
        role: "RIDER",
        entryType: "RIDER_EARNING",
        amount: freshOrder.delivery.fee,
        status: "HELD",
        reference: `rider-held-${freshOrder.id}`,
        context,
      });
    }

    await tx.orderSellerGroup.updateMany({
      where: { orderId: freshOrder.id, payoutEligibleAt: null },
      data: {
        payoutEligibleAt: releaseAt,
        payoutLocked: false,
      },
    });

    await tx.delivery.updateMany({
      where: { orderId: freshOrder.id, payoutEligibleAt: null },
      data: {
        payoutEligibleAt: releaseAt,
        payoutLocked: false,
      },
    });

    await createOrderTimelineIfMissing(
      {
        orderId: freshOrder.id,
        status: "ACCEPTED",
        message: freshOrder.isFoodOrder
          ? "Payment confirmed. Restaurant is preparing your order."
          : "Payment confirmed. Waiting for sellers to dispatch items to the hub.",
      },
      tx,
    );

    await tx.order.update({
      where: { id: freshOrder.id },
      data: { postPaymentFinalized: true },
    });
  });

  if (freshOrder.isFoodOrder) {
    await autoAssignRider(order.id);
  }
}

export async function completeOrderPayment({
  orderId,
  paymentReference,
  method,
  context,
}: CompleteOrderPaymentParams): Promise<CompleteOrderPaymentResult> {
  if (!orderId || !paymentReference) {
    throw new Error("orderId and paymentReference are required");
  }

  const systemEscrowWalletId = await getOrCreateSystemEscrowWallet();

  const result = await prisma.$transaction(
    async (tx) => {
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
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.isPaid) {
        return { justPaid: false, order };
      }

      if (order.sellerGroups.length === 0) {
        throw new Error("Order not properly initialized via placeOrderAction");
      }

      const existingByReference = await tx.transaction.findUnique({
        where: { reference: paymentReference },
        select: { id: true },
      });

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
        const buyerWalletSnapshot = await tx.wallet.findUnique({
          where: { id: buyerWallet.id },
          select: { balance: true },
        });
        if ((buyerWalletSnapshot?.balance ?? 0) < order.totalAmount) {
          throw new Error("Insufficient wallet balance");
        }
      }

      if (!existingByReference) {
        await tx.transaction.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            walletId: buyerWallet?.id,
            type: "ORDER_PAYMENT",
            amount: order.totalAmount,
            status: "SUCCESS",
            reference: paymentReference,
            description: context
              ? `Executed by ${context.service}`
              : method === "CARD"
                ? "Stripe order payment"
                : "Wallet order payment",
          },
        });
      }

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
        context,
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
        context,
      });

      return { justPaid: true, order };
    },
    { timeout: 15000 },
  );

  if (result.justPaid) {
    await finalizePostPayment(result.order, context);
  }

  return result;
}
