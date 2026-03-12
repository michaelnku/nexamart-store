import { PaymentMethod, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateSystemEscrowWallet } from "@/lib/ledger/systemEscrowWallet";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { ServiceContext } from "@/lib/system/serviceContext";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { processPendingJobs } from "@/worker";
import { assertValidTransition } from "@/lib/order/orderLifecycle";
import { commitOrderInventoryInTx } from "@/lib/inventory/reservationService";
import { getPayoutEligibleAtFrom } from "@/lib/payout/timing";

const PLATFORM_COMMISSION_PERCENT = 15;
//const PLATFORM_COMMISSION_PERCENT = 12;
const FINALIZE_ORDER_JOB_TYPE = "FINALIZE_ORDER";
const FINALIZE_ORDER_JOB_ID_PREFIX = "finalize-order";

function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (!("code" in error)) return false;
  const candidate = error as { code?: unknown };
  return candidate.code === "P2002";
}

async function ensureFinalizeOrderJob(
  tx: Prisma.TransactionClient,
  paidOrderId: string,
  isPostPaymentFinalized: boolean,
) {
  if (isPostPaymentFinalized) return;
  const finalizeJobId = `${FINALIZE_ORDER_JOB_ID_PREFIX}-${paidOrderId}`;

  try {
    await tx.job.create({
      data: {
        id: finalizeJobId,
        type: FINALIZE_ORDER_JOB_TYPE,
        status: "PENDING",
        runAt: new Date(),
        maxRetries: 5,
        attempts: 0,
        lastError: null,
        payload: {
          orderId: paidOrderId,
        },
      },
    });
    return;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      // Job already exists; continue with idempotent recovery update path.
    } else {
      throw error;
    }
  }

  await tx.job.updateMany({
    where: {
      id: finalizeJobId,
      status: { in: ["FAILED", "COMPLETED"] },
    },
    data: {
      type: FINALIZE_ORDER_JOB_TYPE,
      status: "PENDING",
      runAt: new Date(),
      maxRetries: 5,
      attempts: 0,
      lastError: null,
      payload: {
        orderId: paidOrderId,
      },
    },
  });
}

export type PaymentMethodType = "CARD" | "WALLET";

export interface CompleteOrderPaymentParams {
  orderId: string;
  paymentReference: string;
  method: PaymentMethodType;
  context?: ServiceContext;
}

export interface CompleteOrderPaymentCoreParams extends CompleteOrderPaymentParams {
  tx: Prisma.TransactionClient;
  systemEscrowWalletId: string;
  checkoutGroupId?: string | null;
  preloadedOrder?: {
    id: string;
    userId: string;
    paymentMethod: PaymentMethod;
    status?: string;
    isPaid: boolean;
    postPaymentFinalized: boolean;
    totalAmount: number;
    sellerGroups: Array<{
      id: string;
      sellerId: string;
      storeId: string;
      subtotal: number;
      shippingFee: number;
    }>;
  };
  preloadedWallet?: {
    id: string;
    balance: number;
    status: "ACTIVE" | "INACTIVE";
  } | null;
  assumePaymentReferenceFresh?: boolean;
  skipWalletBalanceCheck?: boolean;
  skipWalletLedgerTransfer?: boolean;
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

export async function finalizePostPayment(
  orderId: string,
  context?: ServiceContext,
): Promise<void> {
  const freshOrder = await prisma.order.findUnique({
    where: { id: orderId },
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
    const releaseAt = getPayoutEligibleAtFrom(
      new Date(),
      freshOrder.isFoodOrder,
    );

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
        status: "PAID",
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

}

export async function completeOrderPaymentCore({
  tx,
  orderId,
  paymentReference,
  method,
  context,
  systemEscrowWalletId,
  checkoutGroupId,
  preloadedOrder,
  preloadedWallet,
  assumePaymentReferenceFresh = false,
  skipWalletBalanceCheck = false,
  skipWalletLedgerTransfer = false,
}: CompleteOrderPaymentCoreParams): Promise<CompleteOrderPaymentResult> {
  if (!orderId || !paymentReference) {
    throw new Error("orderId and paymentReference are required");
  }

  const order =
    preloadedOrder ??
    (await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        paymentMethod: true,
        status: true,
        isPaid: true,
        postPaymentFinalized: true,
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
    }));

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.isPaid) {
    throw new Error("Order already marked as paid.");
  }

  if (order.sellerGroups.length === 0) {
    throw new Error("Order not properly initialized via placeOrderAction");
  }

  if (!order.status) {
    throw new Error("Order status is missing");
  }

  let transactionRow = assumePaymentReferenceFresh
    ? null
    : await tx.transaction.findUnique({
        where: { reference: paymentReference },
        select: { id: true, orderId: true },
      });

  const buyerWallet =
    method === "WALLET"
      ? preloadedWallet
        ? preloadedWallet
        : await tx.wallet.findUnique({
            where: { userId: order.userId },
            select: { id: true, balance: true, status: true },
          })
      : null;

  if (method === "WALLET" && buyerWallet) {
    if (buyerWallet.status !== "ACTIVE") {
      throw new Error("Wallet is not active");
    }

    if (!skipWalletBalanceCheck) {
      const availableBalance =
        preloadedWallet && preloadedWallet.id === buyerWallet.id
          ? preloadedWallet.balance
          : (
              await tx.wallet.findUnique({
                where: { id: buyerWallet.id },
                select: { balance: true },
              })
            )?.balance ?? 0;
      if (availableBalance < order.totalAmount) {
        throw new Error("Insufficient wallet balance");
      }
    }
  } else if (method === "WALLET") {
    throw new Error("Wallet is not active");
  }

  if (!transactionRow) {
    transactionRow = await tx.transaction.create({
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
      select: { id: true, orderId: true },
    });
  }

  if (transactionRow.orderId !== order.id) {
    if (transactionRow.orderId !== null) {
      throw new Error("Wallet transaction validation failed");
    }
  }

  if (order.paymentMethod === "WALLET" && !transactionRow) {
    throw new Error("Invariant violation: WALLET order without transaction.");
  }

  const escrowReference =
    checkoutGroupId && method === "WALLET"
      ? `escrow-fund-${checkoutGroupId}-${order.id}`
      : `escrow-fund-${order.id}`;

  assertValidTransition(order.status, "PAID");

  await commitOrderInventoryInTx(tx, order.id);

  await Promise.all([
    tx.order.update({
      where: { id: order.id },
      data: {
        isPaid: true,
        status: "PAID",
        paymentMethod: method as PaymentMethod,
      },
    }),
    createEscrowEntryIdempotent(tx, {
      orderId: order.id,
      userId: order.userId,
      role: "BUYER",
      entryType: "FUND",
      amount: order.totalAmount,
      status: "HELD",
      reference: escrowReference,
      context,
    }),
    ...(method === "WALLET" && skipWalletLedgerTransfer
      ? []
      : [
          createDoubleEntryLedger(tx, {
            orderId: order.id,
            fromUserId: order.userId,
            fromWalletId: buyerWallet?.id,
            toWalletId: systemEscrowWalletId,
            entryType: "ESCROW_DEPOSIT",
            amount: order.totalAmount,
            reference: escrowReference,
            resolveFromWallet: method === "WALLET",
            resolveToWallet: false,
            context,
          }),
        ]),
    ensureFinalizeOrderJob(tx, order.id, order.postPaymentFinalized),
  ]);

  return { justPaid: true, order };
}

export async function completeOrderPaymentSideEffects(
  orderId: string,
  context?: ServiceContext,
): Promise<void> {
  if (!orderId) return;
  try {
    await processPendingJobs(1, context);
  } catch (error) {
    console.error("Immediate finalize job processing failed:", error);
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
    async (tx) =>
      completeOrderPaymentCore({
        tx,
        orderId,
        paymentReference,
        method,
        context,
        systemEscrowWalletId,
      }),
    { timeout: 15000 },
  );

  if (result.justPaid) {
    await completeOrderPaymentSideEffects(result.order.id, context);
  }

  return result;
}
