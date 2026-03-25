import { PaymentMethod, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";
import { getOrCreateSystemEscrowWallet } from "@/lib/ledger/systemEscrowWallet";
import { createEscrowEntryIdempotent } from "@/lib/ledger/idempotentEntries";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { ServiceContext } from "@/lib/system/serviceContext";
import { createOrderTimelineIfMissing } from "@/lib/order/timeline";
import { processPendingJobs } from "@/worker";
import { assertValidTransition } from "@/lib/order/orderLifecycle";
import { commitOrderInventoryInTx } from "@/lib/inventory/reservationService";

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
      isFoodOrder: true,
      postPaymentFinalized: true,
    },
  });

  if (!freshOrder || freshOrder.postPaymentFinalized) {
    return;
  }

  await prisma.$transaction(async (tx) => {
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

    // Checkout/payment-time persisted payout fields are the only payout basis.
    // Delivery confirmation moves those stored amounts into held/pending state.
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
      const availableBalance = await calculateWalletBalance(buyerWallet.id, tx);
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
            fromAccountType: "ESCROW",
            toAccountType: "ESCROW",
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

  const result = await prisma.$transaction(async (tx) => {
    const systemEscrowWalletId = await getOrCreateSystemEscrowWallet(tx);

    return completeOrderPaymentCore({
      tx,
      orderId,
      paymentReference,
      method,
      context,
      systemEscrowWalletId,
    });
  });

  if (result.justPaid) {
    await completeOrderPaymentSideEffects(result.order.id, context);
  }

  return result;
}
