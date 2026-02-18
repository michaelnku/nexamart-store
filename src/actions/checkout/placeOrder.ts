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
import { completeOrderPayment } from "@/lib/payments/completeOrderPayment";
import { calculateDrivingDistance } from "@/lib/shipping/mapboxDistance";
import { calculateShippingFee } from "@/lib/shipping/shippingCalculator";

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
  distanceInMiles: _distanceInMiles,
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
  void _distanceInMiles;

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
                  latitude: true,
                  longitude: true,
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

  for (const item of cart.items) {
    if (!item.variantId || !item.variant) {
      return { error: "Invalid cart item. Please reselect product variant." };
    }
  }

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
    (s, i) => s + i.quantity * i.variant!.priceUSD,
    0,
  );

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
      if (address.latitude == null || address.longitude == null) {
        throw new PlaceOrderError(
          "Selected address is missing coordinates. Please update address.",
        );
      }

      const siteConfig = await tx.siteConfiguration.findFirst({
        orderBy: { updatedAt: "desc" },
        select: {
          baseDeliveryRate: true,
          expressMultiplier: true,
        },
      });

      const baseFee = siteConfig?.baseDeliveryRate ?? 0;
      const expressMultiplier =
        deliveryType === "EXPRESS" ? (siteConfig?.expressMultiplier ?? 1) : 1;

      const storeMetricsEntries = await Promise.all(
        Array.from(itemsByStore.entries()).map(async ([storeId, items]) => {
          const store = items[0].product.store;
          if (store.latitude == null || store.longitude == null) {
            throw new PlaceOrderError(
              `Store coordinates are missing for store ${storeId}.`,
            );
          }

          const distance = await calculateDrivingDistance(
            {
              latitude: store.latitude,
              longitude: store.longitude,
            },
            {
              latitude: address.latitude!,
              longitude: address.longitude!,
            },
          );

          const groupShippingFee = calculateShippingFee({
            distanceInMiles: distance.distanceInMiles,
            ratePerMile: store.shippingRatePerMile ?? 0,
            baseFee,
            expressMultiplier,
          });

          return [
            storeId,
            {
              shippingFee: groupShippingFee,
              distanceInMiles: distance.distanceInMiles,
            },
          ] as const;
        }),
      );

      const storeMetrics = new Map(storeMetricsEntries);
      const shippingFee = Array.from(storeMetrics.values()).reduce(
        (sum, item) => sum + item.shippingFee,
        0,
      );

      // Order-level distance is stored as average route distance across seller groups.
      const avgDistanceInMiles =
        storeMetrics.size > 0
          ? Array.from(storeMetrics.values()).reduce(
              (sum, item) => sum + item.distanceInMiles,
              0,
            ) / storeMetrics.size
          : 0;

      const couponResult = await resolveCouponForOrder({
        userId,
        couponId,
        subtotalUSD: subtotal,
        shippingUSD: shippingFee,
      });

      if ("error" in couponResult) {
        throw new PlaceOrderError(couponResult.error);
      }

      const discountAmount = couponResult.discountAmount ?? 0;
      const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

      if (paymentMethod === "WALLET") {
        const wallet = await tx.wallet.upsert({
          where: { userId },
          update: {},
          create: { userId },
          select: { id: true },
        });

        const ledgerTotals = await tx.ledgerEntry.groupBy({
          by: ["direction"],
          where: { walletId: wallet.id },
          _sum: { amount: true },
        });

        const credit =
          ledgerTotals.find((item) => item.direction === "CREDIT")?._sum
            .amount ?? 0;
        const debit =
          ledgerTotals.find((item) => item.direction === "DEBIT")?._sum.amount ??
          0;
        const walletBalance = credit - debit;
        if (walletBalance < totalAmount) {
          throw new PlaceOrderError("Insufficient wallet balance");
        }

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
          distanceInMiles: avgDistanceInMiles,
          shippingFee,
          totalAmount,
          isPaid: false,
          isFoodOrder,
          couponId: couponResult.coupon?.id ?? null,
          discountAmount: discountAmount || null,
          trackingNumber,
          status: "PENDING",
        },
      });

      for (const [storeId, items] of itemsByStore) {
        const sellerId = items[0].product.store.userId;

        const groupSubtotal = items.reduce(
          (s, i) => s + i.quantity * i.variant!.priceUSD,
          0,
        );

        const groupMetrics = storeMetrics.get(storeId);
        if (!groupMetrics) {
          throw new PlaceOrderError(
            `Shipping metrics missing for store ${storeId}.`,
          );
        }

        const group = await tx.orderSellerGroup.create({
          data: {
            orderId: createdOrder.id,
            storeId,
            sellerId,
            subtotal: groupSubtotal,
            shippingFee: groupMetrics.shippingFee,
          },
        });

        await tx.orderItem.createMany({
          data: items.map((i) => ({
            orderId: createdOrder.id,
            sellerGroupId: group.id,
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.variant!.priceUSD,
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

  if (paymentMethod === "WALLET") {
    try {
      const paymentResult = await completeOrderPayment({
        orderId: order.id,
        paymentReference: `wallet-order-${order.id}`,
        method: "WALLET",
      });

      if (paymentResult.justPaid) {
        await applyReferralRewardsForPaidOrder(order.id);
        await generateDeliveryOtpAndCreateDelivery(order.id);
      }
    } catch (error) {
      console.error("Failed to complete wallet order payment:", error);
      return { error: "Wallet payment failed. Please try again." };
    }
  }

  return {
    success: true,
    orderId: order.id,
    trackingNumber: order.trackingNumber,
  };
}
