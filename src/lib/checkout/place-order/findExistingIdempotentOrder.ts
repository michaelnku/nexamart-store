import "server-only";

import { prisma } from "@/lib/prisma";
import { PlaceOrderError } from "./placeOrder.errors";
import type { IdempotencyReplayLookup } from "./placeOrder.types";

export async function findExistingIdempotentOrder({
  idempotencyKey,
  userId,
}: {
  idempotencyKey: string;
  userId: string;
}): Promise<IdempotencyReplayLookup> {
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existingKey?.orderId) {
    if (existingKey.userId !== userId) {
      throw new PlaceOrderError(
        "Invalid checkout request. Please refresh and try again.",
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: existingKey.orderId },
      select: {
        id: true,
        trackingNumber: true,
        totalAmount: true,
        checkoutGroupId: true,
      },
    });

    if (!existingOrder) {
      throw new PlaceOrderError("Checkout failed. Please try again.");
    }

    const existingOrders = existingOrder.checkoutGroupId
      ? await prisma.order.findMany({
          where: { checkoutGroupId: existingOrder.checkoutGroupId },
          select: {
            id: true,
            sellerGroups: {
              select: {
                store: {
                  select: { name: true },
                },
              },
            },
          },
        })
      : [];

    const totalAmount = existingOrder.checkoutGroupId
      ? await prisma.order
          .aggregate({
            where: { checkoutGroupId: existingOrder.checkoutGroupId },
            _sum: { totalAmount: true },
          })
          .then((result) => result._sum.totalAmount ?? 0)
      : existingOrder.totalAmount;

    return {
      result: {
        success: true,
        orderId: existingOrder.id,
        trackingNumber: existingOrder.trackingNumber,
        checkoutGroupId: existingOrder.checkoutGroupId,
        totalAmount,
        orders: existingOrders.length
          ? existingOrders.map((order) => ({
              orderId: order.id,
              sellerName: order.sellerGroups
                .map((group) => group.store.name)
                .join(", "),
            }))
          : [{ orderId: existingOrder.id, sellerName: "Store" }],
      },
      existingKey: null,
    };
  }

  return {
    result: null,
    existingKey,
  };
}
