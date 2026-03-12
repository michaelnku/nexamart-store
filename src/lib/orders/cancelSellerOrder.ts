import { Prisma } from "@/generated/prisma";
import {
  InventoryReleaseReason,
  TransactionStatus,
} from "@/generated/prisma/client";
import { createNotification } from "@/lib/notifications/createNotification";
import { releaseSellerGroupInventoryInTx } from "@/lib/inventory/reservationService";
import {
  getSellerCancellationReasonLabel,
  type SellerCancelOrderInput,
} from "@/lib/orders/sellerCancellation";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import {
  assertValidTransition,
  normalizeOrderStatus,
} from "@/lib/order/orderLifecycle";
import { refundCapturedCardPayment } from "@/lib/payments/refundCapturedCardPayment";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { creditBuyerWalletRefundInTx } from "@/lib/refunds/creditBuyerWalletRefund";

type Tx = Prisma.TransactionClient;

const SELLER_CANCELLABLE_GROUP_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "DISPATCHED_TO_HUB",
] as const;

type CancellationContext = {
  id: string;
  sellerId: string;
  status: string;
  subtotal: number;
  store: {
    name: string;
  };
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  cancelNote: string | null;
  order: {
    id: string;
    userId: string;
    status: string;
    isPaid: boolean;
    paymentMethod: "WALLET" | "CARD" | null;
    trackingNumber: string | null;
    delivery: {
      id: string;
      riderId: string | null;
    } | null;
    transactions: Array<{
      id: string;
      type: string;
      status: string;
      reference: string | null;
      description: string | null;
    }>;
  };
};

type PersistedRefundResult = {
  reference: string;
  status: TransactionStatus;
  description: string;
};

type SellerOrderCancellationResult = {
  success: true;
  alreadyCancelled: boolean;
  orderId: string;
  buyerUserId: string;
  trackingNumber: string | null;
  refund: PersistedRefundResult;
};

async function getCancellationContext(
  tx: Tx,
  sellerGroupId: string,
): Promise<CancellationContext | null> {
  return tx.orderSellerGroup.findUnique({
    where: { id: sellerGroupId },
    select: {
      id: true,
      sellerId: true,
      status: true,
      subtotal: true,
      cancelledAt: true,
      cancelledBy: true,
      cancelReason: true,
      cancelNote: true,
      store: {
        select: {
          name: true,
        },
      },
      order: {
        select: {
          id: true,
          userId: true,
          status: true,
          isPaid: true,
          paymentMethod: true,
          trackingNumber: true,
          delivery: {
            select: {
              id: true,
              riderId: true,
            },
          },
          transactions: {
            where: {
              type: {
                in: ["ORDER_PAYMENT", "REFUND"],
              },
            },
            select: {
              id: true,
              type: true,
              status: true,
              reference: true,
              description: true,
            },
          },
        },
      },
    },
  });
}

function ensureCancellableBySeller(context: CancellationContext, sellerId: string) {
  if (context.sellerId !== sellerId) {
    throw new Error("Forbidden");
  }

  if (context.status === "CANCELLED") {
    return;
  }

  if (
    !SELLER_CANCELLABLE_GROUP_STATUSES.includes(
      context.status as (typeof SELLER_CANCELLABLE_GROUP_STATUSES)[number],
    )
  ) {
    throw new Error("Cannot cancel at this stage.");
  }
}

function findOrderPaymentReference(context: CancellationContext) {
  return (
    context.order.transactions.find(
      (transaction) =>
        transaction.type === "ORDER_PAYMENT" &&
        transaction.reference?.startsWith("order-payment-"),
    )?.reference ?? null
  );
}

function buildNoRefundNeededDescription(orderIsPaid: boolean) {
  return orderIsPaid
    ? "No refund action was required for this cancellation."
    : "Payment was not captured, so no refund was required.";
}

function buildBuyerNotificationMessage(params: {
  storeName: string;
  reasonLabel: string;
  note?: string;
  refundDescription: string;
}) {
  const parts = [
    `${params.storeName} cancelled its items from your order.`,
    `Reason: ${params.reasonLabel}.`,
    params.note ? `Note: ${params.note}.` : null,
    params.refundDescription,
  ].filter(Boolean);

  return parts.join(" ");
}

async function resolveRefundResult(
  context: CancellationContext,
  sellerGroupId: string,
): Promise<PersistedRefundResult> {
  const existingRefundTransaction = context.order.transactions.find(
    (transaction) =>
      transaction.type === "REFUND" &&
      transaction.reference === `seller-cancel-refund-${sellerGroupId}`,
  );

  if (existingRefundTransaction) {
    return {
      reference: existingRefundTransaction.reference ?? `seller-cancel-refund-${sellerGroupId}`,
      status: existingRefundTransaction.status as TransactionStatus,
      description:
        existingRefundTransaction.description ??
        (existingRefundTransaction.status === "CANCELLED"
          ? buildNoRefundNeededDescription(context.order.isPaid)
          : "Refund already processed for this seller cancellation."),
    };
  }

  if (context.order.paymentMethod === "WALLET" && context.order.isPaid) {
    return {
      reference: `seller-cancel-refund-${sellerGroupId}`,
      status: "SUCCESS",
      description: "Wallet refund issued back to your NexaMart wallet.",
    };
  }

  if (context.order.paymentMethod === "CARD" && context.order.isPaid) {
    const paymentReference = findOrderPaymentReference(context);

    if (!paymentReference) {
      throw new Error("Card payment reference not found for refund.");
    }

    return refundCapturedCardPayment({
      orderId: context.order.id,
      sellerGroupId,
      amount: context.subtotal,
      paymentReference,
    });
  }

  return {
    reference: `seller-cancel-refund-${sellerGroupId}`,
    status: "CANCELLED",
    description: buildNoRefundNeededDescription(context.order.isPaid),
  };
}

async function persistRefundResult(
  tx: Tx,
  context: CancellationContext,
  refund: PersistedRefundResult,
) {
  if (context.order.paymentMethod === "WALLET" && context.order.isPaid) {
    await creditBuyerWalletRefundInTx(tx, {
      orderId: context.order.id,
      buyerUserId: context.order.userId,
      amount: context.subtotal,
      reference: refund.reference,
      transactionReference: refund.reference,
      description: refund.description,
    });
    return;
  }

  await tx.transaction.upsert({
    where: { reference: refund.reference },
    update: {
      amount: context.subtotal,
      status: refund.status,
      description: refund.description,
      userId: context.order.userId,
      orderId: context.order.id,
    },
    create: {
      orderId: context.order.id,
      userId: context.order.userId,
      type: "REFUND",
      amount: context.subtotal,
      status: refund.status,
      reference: refund.reference,
      description: refund.description,
    },
  });
}

async function persistCancellationState(
  tx: Tx,
  context: CancellationContext,
  input: SellerCancelOrderInput,
  refund: PersistedRefundResult,
) {
  const reasonLabel = getSellerCancellationReasonLabel(input.reason);
  const cancelMessage = buildBuyerNotificationMessage({
    storeName: context.store.name,
    reasonLabel,
    note: input.note,
    refundDescription: refund.description,
  });

  if (context.status !== "CANCELLED") {
    await tx.orderSellerGroup.update({
      where: { id: context.id },
      data: {
        status: "CANCELLED",
        payoutStatus: "CANCELLED",
        payoutEligibleAt: null,
        payoutLocked: false,
        cancelledAt: new Date(),
        cancelledBy: "SELLER",
        cancelReason: input.reason,
        cancelNote: input.note ?? null,
      },
    });

    if (context.order.isPaid) {
      await releaseSellerGroupInventoryInTx(tx, context.id, {
        allowCommittedRelease: true,
        reason: InventoryReleaseReason.SELLER_CANCELLATION,
      });
    }
  }

  await persistRefundResult(tx, context, refund);

  await createOrderTimelineIfMissing(
    {
      orderId: context.order.id,
      status: normalizeOrderStatus(context.order.status),
      message: cancelMessage,
    },
    tx,
  );

  const remainingActiveGroups = await tx.orderSellerGroup.count({
    where: {
      orderId: context.order.id,
      status: { not: "CANCELLED" },
    },
  });

  if (remainingActiveGroups === 0 && normalizeOrderStatus(context.order.status) !== "CANCELLED") {
    assertValidTransition(context.order.status, "CANCELLED");

    await tx.order.update({
      where: { id: context.order.id },
      data: { status: "CANCELLED" },
    });

    await createOrderTimelineIfMissing(
      {
        orderId: context.order.id,
        status: "CANCELLED",
        message: "All seller items were cancelled. The order has been cancelled.",
      },
      tx,
    );

    if (context.order.delivery) {
      await tx.delivery.update({
        where: { id: context.order.delivery.id },
        data: { status: "CANCELLED" },
      });

      if (context.order.delivery.riderId) {
        await tx.riderProfile.updateMany({
          where: { userId: context.order.delivery.riderId },
          data: { isAvailable: true },
        });
      }
    }
  }

  return cancelMessage;
}

export async function cancelSellerOrder(params: {
  sellerId: string;
  input: SellerCancelOrderInput;
}): Promise<SellerOrderCancellationResult> {
  const initialContext = await prisma.orderSellerGroup.findUnique({
    where: { id: params.input.sellerGroupId },
    select: {
      id: true,
      sellerId: true,
      status: true,
      subtotal: true,
      cancelledAt: true,
      cancelledBy: true,
      cancelReason: true,
      cancelNote: true,
      store: {
        select: {
          name: true,
        },
      },
      order: {
        select: {
          id: true,
          userId: true,
          status: true,
          isPaid: true,
          paymentMethod: true,
          trackingNumber: true,
          delivery: {
            select: {
              id: true,
              riderId: true,
            },
          },
          transactions: {
            where: {
              type: {
                in: ["ORDER_PAYMENT", "REFUND"],
              },
            },
            select: {
              id: true,
              type: true,
              status: true,
              reference: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!initialContext) {
    throw new Error("Order group not found");
  }

  ensureCancellableBySeller(initialContext, params.sellerId);

  const refund = await resolveRefundResult(initialContext, params.input.sellerGroupId);

  const result = await prisma.$transaction(async (tx) => {
    const latestContext = await getCancellationContext(
      tx,
      params.input.sellerGroupId,
    );

    if (!latestContext) {
      throw new Error("Order group not found");
    }

    ensureCancellableBySeller(latestContext, params.sellerId);

    const existingRefundTransaction = await tx.transaction.findUnique({
      where: { reference: refund.reference },
      select: { reference: true, status: true, description: true },
    });

    const persistedRefund: PersistedRefundResult = existingRefundTransaction
      ? {
          reference: existingRefundTransaction.reference ?? refund.reference,
          status: existingRefundTransaction.status as TransactionStatus,
          description:
            existingRefundTransaction.description ?? refund.description,
        }
      : refund;

    const notificationMessage = await persistCancellationState(
      tx,
      latestContext,
      params.input,
      persistedRefund,
    );

    return {
      alreadyCancelled: latestContext.status === "CANCELLED",
      orderId: latestContext.order.id,
      buyerUserId: latestContext.order.userId,
      trackingNumber: latestContext.order.trackingNumber,
      notificationMessage,
      refund: persistedRefund,
      storeName: latestContext.store.name,
    };
  }, { timeout: 15000 });

  try {
    await createNotification({
      userId: result.buyerUserId,
      event: "SYSTEM",
      title: "Order update",
      message: result.notificationMessage,
      link: `/customer/order/${result.orderId}`,
      key: `seller-cancel-order-${params.input.sellerGroupId}`,
      metadata: {
        orderId: result.orderId,
        sellerGroupId: params.input.sellerGroupId,
        refundStatus: result.refund.status,
      },
    });

    await pusherServer.trigger(
      `notifications-${result.buyerUserId}`,
      "new-notification",
      {
        event: "SYSTEM",
        orderId: result.orderId,
      },
    );
  } catch (error) {
    console.error("Seller cancellation notification failed:", error);
  }

  return {
    success: true,
    alreadyCancelled: result.alreadyCancelled,
    orderId: result.orderId,
    buyerUserId: result.buyerUserId,
    trackingNumber: result.trackingNumber,
    refund: result.refund,
  };
}
