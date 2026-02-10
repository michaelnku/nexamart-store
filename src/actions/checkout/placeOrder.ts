"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { DeliveryType, PaymentMethod } from "@/generated/prisma/client";
import { generateTrackingNumber } from "@/components/helper/generateTrackingNumber";
import { resolveCouponForOrder } from "@/lib/coupons/resolveCouponForOrder";
import { applyReferralRewardsForPaidOrder } from "@/lib/referrals/applyReferralRewards";

export async function placeOrderAction({
  deliveryAddress,
  paymentMethod,
  deliveryType,
  distanceInMiles,
  couponId,
  idempotencyKey,
}: {
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  distanceInMiles?: number;
  couponId?: string | null;
  idempotencyKey: string;
}) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existingKey?.orderId) {
    return {
      success: true,
      orderId: existingKey.orderId,
    };
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              store: {
                select: {
                  id: true,
                  userId: true,
                  shippingRatePerMile: true,
                  type: true,
                },
              },
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

  const variantQuantities = new Map<string, number>();
  for (const item of cart.items) {
    if (!item.variantId) continue;
    const current = variantQuantities.get(item.variantId) ?? 0;
    variantQuantities.set(item.variantId, current + item.quantity);
  }

  const miles = distanceInMiles ?? 0;

  const storeTypes = new Set(cart.items.map((i) => i.product.store.type));
  const isFoodOrder = storeTypes.has("FOOD");
  if (isFoodOrder && storeTypes.size > 1) {
    return { error: "Food orders cannot be mixed with non-food items" };
  }

  const subtotal = cart.items.reduce(
    (s, i) => s + i.quantity * (i.variant?.priceUSD ?? i.product.basePriceUSD),
    0,
  );

  const shippingFee = cart.items.reduce((s, i) => {
    return s + (i.product.store.shippingRatePerMile ?? 0) * miles;
  }, 0);

  const couponResult = await resolveCouponForOrder({
    userId,
    couponId,
    subtotalUSD: subtotal,
    shippingUSD: shippingFee,
  });

  if ("error" in couponResult) return { error: couponResult.error };

  const discountAmount = couponResult.discountAmount ?? 0;
  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  const itemsByStore = new Map<string, typeof cart.items>();

  for (const item of cart.items) {
    const storeId = item.product.store.id;
    if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
    itemsByStore.get(storeId)!.push(item);
  }

  const trackingNumber = generateTrackingNumber();

  const order = await prisma.$transaction(async (tx) => {
    if (paymentMethod === "WALLET") {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balance: true },
      });

      if (!wallet || wallet.balance < totalAmount) {
        throw new Error("Insufficient wallet balance");
      }

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
          description: "Order payment",
        },
      });
    }

    const createdOrder = await tx.order.create({
      data: {
        userId,
        deliveryAddress,
        paymentMethod,
        deliveryType,
        distanceInMiles: miles,
        shippingFee,
        totalAmount,
        isPaid: paymentMethod === "WALLET",
        isFoodOrder,
        couponId: couponResult.coupon?.id ?? null,
        discountAmount: discountAmount || null,
        trackingNumber,
        status: "PENDING",
      },
    });

    if (paymentMethod === "WALLET" && variantQuantities.size > 0) {
      for (const [variantId, quantity] of variantQuantities.entries()) {
        await tx.productVariant.updateMany({
          where: { id: variantId },
          data: { stock: { decrement: quantity } },
        });
      }
    }

    for (const [storeId, items] of itemsByStore) {
      const sellerId = items[0].product.store.userId;

      const groupSubtotal = items.reduce(
        (s, i) =>
          s + i.quantity * (i.variant?.priceUSD ?? i.product.basePriceUSD),
        0,
      );

      const groupShipping = items.reduce(
        (s) => s + (items[0].product.store.shippingRatePerMile ?? 0) * miles,
        0,
      );

      const group = await tx.orderSellerGroup.create({
        data: {
          orderId: createdOrder.id,
          storeId,
          sellerId,
          subtotal: groupSubtotal,
          shippingFee: groupShipping,
        },
      });

      await tx.orderItem.createMany({
        data: items.map((i) => ({
          orderId: createdOrder.id,
          sellerGroupId: group.id,
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.variant?.priceUSD ?? i.product.basePriceUSD,
        })),
      });
    }

    if (couponResult.coupon?.id) {
      await tx.couponUsage.create({
        data: {
          couponId: couponResult.coupon.id,
          userId,
          orderId: createdOrder.id,
        },
      });

      await tx.coupon.update({
        where: { id: couponResult.coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId,
        orderId: createdOrder.id,
      },
    });

    return createdOrder;
  });

  await prisma.orderTimeline.create({
    data: {
      orderId: order.id,
      status: "PENDING",
      message: "Order placed successfully",
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId,
        title: "Order Confirmed",
        message: `Your order ${order.trackingNumber} was placed successfully`,
      },
      ...Array.from(itemsByStore.values()).map((items) => ({
        userId: items[0].product.store.userId,
        title: "New Order Received",
        message: `You have a new order to fulfill`,
      })),
    ],
  });

  if (order.isPaid) {
    await applyReferralRewardsForPaidOrder(order.id);
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return {
    success: true,
    orderId: order.id,
    trackingNumber: order.trackingNumber,
  };
}
