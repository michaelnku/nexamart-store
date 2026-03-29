import "server-only";

import { PaymentMethod, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";
import { getOrCreateSystemEscrowWallet } from "@/lib/ledger/systemEscrowWallet";
import { TREASURY_LEDGER_ROUTING } from "@/lib/ledger/treasurySubledgers";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import {
  completeOrderPaymentCore,
  type CompleteOrderPaymentCoreParams,
} from "@/lib/payments/completeOrderPayment";
import { PlaceOrderError } from "./placeOrder.errors";
import type { CreatedOrdersPayload } from "./placeOrder.types";

type WalletSettlementOrderPayload = NonNullable<
  CompleteOrderPaymentCoreParams["preloadedOrder"]
>;
type WalletSettlementWalletPayload = NonNullable<
  CompleteOrderPaymentCoreParams["preloadedWallet"]
>;

export async function runWalletSettlement({
  userId,
  checkoutGroupId,
  createdOrders,
  checkoutTotalAmount,
}: {
  userId: string;
  checkoutGroupId: string | null;
  createdOrders: CreatedOrdersPayload;
  checkoutTotalAmount: number;
}) {
  let walletJustPaid = false;
  const paidOrderIds: string[] = [];
  const parentReference = `wallet-checkout-${checkoutGroupId ?? createdOrders[0]?.id}`;
  const createdOrderIds = createdOrders.map((order) => order.id);

  const runWalletSettlementParentTransaction = async () =>
    prisma.$transaction(async (tx) => {
      const ordersForSettlement = await tx.order.findMany({
        where: { id: { in: createdOrderIds }, userId },
        select: {
          id: true,
          userId: true,
          status: true,
          isPaid: true,
          paymentMethod: true,
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
      });

      if (ordersForSettlement.length !== createdOrderIds.length) {
        throw new PlaceOrderError("Order settlement payload is incomplete.");
      }

      const walletForPayment = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balance: true, status: true },
      });

      if (!walletForPayment || walletForPayment.status !== "ACTIVE") {
        throw new PlaceOrderError(
          "Activate your wallet before paying with it.",
        );
      }

      const availableWalletBalance = await calculateWalletBalance(
        walletForPayment.id,
        tx,
      );
      const systemEscrowWalletId = await getOrCreateSystemEscrowWallet(tx);

      const existingParentTransaction = await tx.transaction.findUnique({
        where: { reference: parentReference },
        select: { id: true },
      });

      const alreadyPaidOrderIds: string[] = [];
      const ordersToFinalize: Array<{
        orderId: string;
        paymentReference: string;
        preloadedOrder: WalletSettlementOrderPayload;
      }> = [];

      for (const order of ordersForSettlement) {
        if (order.isPaid) {
          alreadyPaidOrderIds.push(order.id);
          continue;
        }

        if (order.status !== "PENDING_PAYMENT") {
          throw new PlaceOrderError(
            "Order already settled or in invalid status for payment.",
          );
        }

        ordersToFinalize.push({
          orderId: order.id,
          paymentReference: `${parentReference}-order-${order.id}`,
          preloadedOrder: {
            id: order.id,
            userId: order.userId,
            paymentMethod: (order.paymentMethod ?? "WALLET") as PaymentMethod,
            status: order.status,
            isPaid: order.isPaid,
            postPaymentFinalized: order.postPaymentFinalized,
            totalAmount: order.totalAmount,
            sellerGroups: order.sellerGroups,
          },
        });
      }

      if (!existingParentTransaction) {
        if (availableWalletBalance < checkoutTotalAmount) {
          throw new PlaceOrderError(
            "Insufficient wallet balance. Please choose another payment method.",
          );
        }

        await tx.transaction.create({
          data: {
            orderId: null,
            userId,
            walletId: walletForPayment.id,
            type: "ORDER_PAYMENT",
            amount: checkoutTotalAmount,
            status: "SUCCESS",
            reference: parentReference,
            description: "Wallet checkout parent transaction",
          },
        });

        await createDoubleEntryLedger(tx, {
          fromUserId: userId,
          fromWalletId: walletForPayment.id,
          toWalletId: systemEscrowWalletId,
          entryType: "ESCROW_DEPOSIT",
          amount: checkoutTotalAmount,
          reference: `escrow-fund-${checkoutGroupId ?? createdOrderIds[0]}`,
          ...TREASURY_LEDGER_ROUTING.orderEscrowFunding,
          resolveFromWallet: false,
          resolveToWallet: false,
        });
      }

      return {
        alreadyPaidOrderIds,
        ordersToFinalize,
        systemEscrowWalletId,
        walletForPayment: {
          ...walletForPayment,
          balance: availableWalletBalance,
        } as WalletSettlementWalletPayload,
      };
    });

  const settlementPlan = await (async () => {
    try {
      return await runWalletSettlementParentTransaction();
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return runWalletSettlementParentTransaction();
      }
      throw error;
    }
  })();

  paidOrderIds.push(...settlementPlan.alreadyPaidOrderIds);

  for (const orderToFinalize of settlementPlan.ordersToFinalize) {
    const paymentResult = await prisma.$transaction((tx) =>
      completeOrderPaymentCore({
        tx,
        orderId: orderToFinalize.orderId,
        checkoutGroupId,
        paymentReference: orderToFinalize.paymentReference,
        method: "WALLET",
        systemEscrowWalletId: settlementPlan.systemEscrowWalletId,
        preloadedOrder: orderToFinalize.preloadedOrder,
        preloadedWallet: settlementPlan.walletForPayment,
        skipWalletBalanceCheck: true,
        skipWalletLedgerTransfer: true,
      }),
    );

    if (paymentResult.justPaid) {
      walletJustPaid = true;
      paidOrderIds.push(paymentResult.order.id);
    }
  }

  return {
    paidOrderIds,
    walletJustPaid,
  };
}

