"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { DeliveryType, PaymentMethod } from "@/generated/prisma/client";
import { generateTrackingNumber } from "@/components/helper/generateTrackingNumber";

const MAX_RETRIES = 3;

export const placeOrderAction = async ({
  deliveryAddress,
  paymentMethod,
  deliveryType,
  distanceInMiles,
}: {
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  distanceInMiles?: number;
}) => {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              store: { select: { userId: true, shippingRatePerMile: true } },
            },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Cart is empty" };
  }

  const subtotal = cart.items.reduce(
    (sum, item) =>
      sum +
      item.quantity * (item.variant?.priceUSD ?? item.product.basePriceUSD),
    0,
  );

  const miles = distanceInMiles ?? 0;
  const shippingFee = cart.items.reduce((sum, item) => {
    const rate = item.product.store.shippingRatePerMile ?? 0;
    return sum + rate * miles;
  }, 0);

  const totalAmount = subtotal + shippingFee;

  let order;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const trackingNumber = generateTrackingNumber();

      order = await prisma.$transaction(async (tx) => {
        // WALLET PAYMENT
        if (paymentMethod === "WALLET") {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet) throw new Error("Wallet not found");
          if (wallet.balance < totalAmount)
            throw new Error("Insufficient wallet balance");

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: totalAmount } },
          });

          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              userId,
              amount: totalAmount,
              type: "ORDER_PAYMENT",
              status: "SUCCESS",
              description: "Payment for order",
            },
          });
        }

        // CREATE ORDER (PENDING)
        const createdOrder = await tx.order.create({
          data: {
            userId,
            deliveryAddress,
            paymentMethod,
            deliveryType,
            distanceInMiles: miles,
            shippingFee,
            totalAmount,
            trackingNumber,
            status: "PENDING",
            items: {
              createMany: {
                data: cart.items.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  price: item.variant?.priceUSD ?? item.product.basePriceUSD,
                })),
              },
            },
          },
        });

        // INITIAL TIMELINE ENTRY
        await tx.orderTimeline.create({
          data: {
            orderId: createdOrder.id,
            status: "PENDING",
            message: "Order placed successfully",
          },
        });

        return createdOrder;
      });

      break;
    } catch (err: any) {
      if (err.code !== "P2002") throw err;
    }
  }

  if (!order) {
    return { error: "Failed to generate tracking number" };
  }

  //   await prisma.notification.create({
  //   data: {
  //     userId,
  //     title: "Order Confirmed",
  //     message: `Your order has been placed. Tracking number: ${order.trackingNumber}`,
  //   },
  // });

  // await prisma.notification.create({
  //   data: {
  //     userId: cart.items[0].product.store.userId,
  //     title: "New Order Received",
  //     message: `You received a new order: ${order.id}`,
  //   },
  // });

  // CLEANUP
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return {
    success: true,
    orderId: order.id,
    trackingNumber: order.trackingNumber,
  };
};
