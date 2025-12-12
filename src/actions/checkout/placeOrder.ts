"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { DeliveryType } from "@/generated/prisma/client";

export const placeOrderAction = async ({
  deliveryAddress,
  paymentMethod,
  deliveryType,
  distanceInMiles,
}: {
  deliveryAddress: string;
  paymentMethod: "PAY_ON_DELIVERY" | "PAY_WITH_WALLET";
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

  if (!cart || cart.items.length === 0) return { error: "Cart is empty" };

  const subtotal = cart.items.reduce(
    (sum, item) =>
      sum + item.quantity * (item.variant?.price ?? item.product.basePrice),
    0
  );

  const miles = distanceInMiles ?? 0;
  const shippingFee = cart.items.reduce((sum, item) => {
    const rate = item.product.store.shippingRatePerMile ?? 0;
    return sum + rate * miles;
  }, 0);

  const totalAmount = subtotal + shippingFee;

  const result = await prisma.$transaction(async (tx) => {
    if (paymentMethod === "PAY_WITH_WALLET") {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) return { error: "Wallet not found" };
      if (wallet.balance < totalAmount)
        return { error: "Insufficient wallet balance" };

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
          description: `Payment for order`,
        },
      });
    }

    //    const trackingNumber = `NEX-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const order = await tx.order.create({
      data: {
        userId,
        deliveryAddress,
        paymentMethod,
        deliveryType,
        distanceInMiles: miles,
        shippingFee,
        totalAmount,
        //trackingNumber,
        items: {
          createMany: {
            data: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant?.price ?? item.product.basePrice,
            })),
          },
        },
      },
    });

    return { success: true, orderId: order.id };
  });

  if ("error" in result) return result;

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

  // STEP 3: cleanup outside transaction
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return result;
};
