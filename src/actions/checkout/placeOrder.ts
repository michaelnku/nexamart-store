"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import {
  DeliveryType,
  PaymentMethod,
  type Order,
} from "@/generated/prisma/client";
import { generateTrackingNumber } from "@/components/helper/generateTrackingNumber";
import { resolveCouponForOrder } from "@/lib/coupons/resolveCouponForOrder";
import { applyReferralRewardsForPaidOrder } from "@/lib/referrals/applyReferralRewards";
import { generateDeliveryOtpAndCreateDelivery } from "@/lib/delivery/generateDeliveryOtp";

class PlaceOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaceOrderError";
  }
}

export async function placeOrderAction({
  addressId,
  paymentMethod,
  deliveryType,
  distanceInMiles,
  couponId,
  idempotencyKey,
}: {
  addressId: string;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  distanceInMiles?: number;
  couponId?: string | null;
  idempotencyKey: string;
}) {
  const userId = await CurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return { error: "Invalid checkout request. Please refresh and try again." };
  }

  let existingKey = null;

  try {
    existingKey = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });
  } catch (error) {
    console.error("Idempotency lookup failed:", error);
    return { error: "Checkout failed. Please try again." };
  }

  if (existingKey?.orderId) {
    if (existingKey.userId !== userId) {
      return { error: "Invalid checkout request. Please refresh and try again." };
    }
    return {
      success: true,
      orderId: existingKey.orderId,
    };
  }

  if (existingKey && existingKey.userId !== userId) {
    return { error: "Invalid checkout request. Please refresh and try again." };
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

  const itemsByStore = new Map<string, typeof cart.items>();

  for (const item of cart.items) {
    const storeId = item.product.store.id;
    if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
    itemsByStore.get(storeId)!.push(item);
  }

  const subtotal = cart.items.reduce(
    (s, i) => s + i.quantity * (i.variant?.priceUSD ?? i.product.basePriceUSD),
    0,
  );

  const shippingByStore = new Map<string, number>();
  for (const [storeId, items] of itemsByStore.entries()) {
    const storeRate = items[0].product.store.shippingRatePerMile ?? 0;
    shippingByStore.set(storeId, storeRate * miles);
  }

  const shippingFee = Array.from(shippingByStore.values()).reduce(
    (sum, fee) => sum + fee,
    0,
  );

  const couponResult = await resolveCouponForOrder({
    userId,
    couponId,
    subtotalUSD: subtotal,
    shippingUSD: shippingFee,
  });

  if ("error" in couponResult) return { error: couponResult.error };

  const discountAmount = couponResult.discountAmount ?? 0;
  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  const trackingNumber = generateTrackingNumber();

  let order: Order;

  try {
    order = await prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: {
          id: addressId,
          userId,
        },
      });

      if (!address) {
        throw new PlaceOrderError("Invalid address");
      }

      if (paymentMethod === "WALLET") {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
          select: { id: true, balance: true },
        });

        if (!wallet || wallet.balance < totalAmount) {
          throw new PlaceOrderError("Insufficient wallet balance");
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

          deliveryFullName: address.fullName,
          deliveryPhone: address.phone,
          deliveryStreet: address.street,
          deliveryCity: address.city,
          deliveryState: address.state ?? "",
          deliveryCountry: address.country,
          deliveryPostal: address.postalCode ?? "",

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
          const updated = await tx.productVariant.updateMany({
            where: {
              id: variantId,
              stock: { gte: quantity },
            },
            data: { stock: { decrement: quantity } },
          });

          if (updated.count !== 1) {
            throw new PlaceOrderError("One or more items are out of stock");
          }
        }
      }

      for (const [storeId, items] of itemsByStore) {
        const sellerId = items[0].product.store.userId;

        const groupSubtotal = items.reduce(
          (s, i) =>
            s + i.quantity * (i.variant?.priceUSD ?? i.product.basePriceUSD),
          0,
        );

        const groupShipping = shippingByStore.get(storeId) ?? 0;

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

      const keyRecord = await tx.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
        select: { userId: true },
      });

      if (keyRecord && keyRecord.userId !== userId) {
        throw new PlaceOrderError(
          "Invalid checkout request. Please refresh and try again.",
        );
      }

      if (keyRecord) {
        await tx.idempotencyKey.update({
          where: { key: idempotencyKey },
          data: { orderId: createdOrder.id },
        });
      } else {
        await tx.idempotencyKey.create({
          data: {
            key: idempotencyKey,
            userId,
            orderId: createdOrder.id,
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return createdOrder;
    });
  } catch (error) {
    if (error instanceof PlaceOrderError) {
      return { error: error.message };
    }

    console.error("Place order transaction failed:", error);
    return { error: "Checkout failed. Please try again." };
  }

  try {
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
  } catch (error) {
    console.error("Post-order side effects failed:", error);
  }

  if (order.isPaid) {
    try {
      await applyReferralRewardsForPaidOrder(order.id);
    } catch (error) {
      console.error("Failed to apply referral rewards:", error);
    }
  }

  if (order.isPaid && paymentMethod === "WALLET") {
    try {
      await generateDeliveryOtpAndCreateDelivery(order.id);
    } catch (error) {
      console.error("Failed to create delivery OTP:", error);
    }
  }

  return {
    success: true,
    orderId: order.id,
    trackingNumber: order.trackingNumber,
  };
}
