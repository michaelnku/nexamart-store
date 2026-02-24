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
import {
  completeOrderPaymentCore,
  completeOrderPaymentSideEffects,
} from "@/lib/payments/completeOrderPayment";
import { calculateDrivingDistance } from "@/lib/shipping/mapboxDistance";
import { calculateShippingFee } from "@/lib/shipping/shippingCalculator";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";
import { getOrCreateSystemEscrowWallet } from "@/lib/ledger/systemEscrowWallet";

class PlaceOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaceOrderError";
  }
}

function buildSellerGroupCodes(orderId: string, storeId: string) {
  const seed = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const storeSeed = storeId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const orderSeed = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();

  return {
    hubInboundCode: `HUB-${storeSeed}-${seed}`,
    internalTrackingNumber: `SG-${orderSeed}-${seed}`,
  };
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
      return {
        error: "Invalid checkout request. Please refresh and try again.",
      };
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
  const snapshotCartItemIds = cart.items.map((item) => item.id);

  let address: Awaited<ReturnType<typeof prisma.address.findFirst>>;
  let storeMetrics = new Map<
    string,
    {
      shippingFee: number;
      distanceInMiles: number;
    }
  >();
  let shippingFee = 0;
  let avgDistanceInMiles = 0;
  let couponResult: Awaited<ReturnType<typeof resolveCouponForOrder>>;
  let discountAmount = 0;
  let totalAmount = 0;

  try {
    address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return { error: "Invalid address" };
    }
    if (address.latitude == null || address.longitude == null) {
      return {
        error:
          "Selected address is missing coordinates. Please update address.",
      };
    }

    const siteConfig = await prisma.siteConfiguration.findFirst({
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
            latitude: address!.latitude!,
            longitude: address!.longitude!,
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

    storeMetrics = new Map(storeMetricsEntries);
    shippingFee = Array.from(storeMetrics.values()).reduce(
      (sum, item) => sum + item.shippingFee,
      0,
    );

    // Order-level distance is stored as average route distance across seller groups.
    avgDistanceInMiles =
      storeMetrics.size > 0
        ? Array.from(storeMetrics.values()).reduce(
            (sum, item) => sum + item.distanceInMiles,
            0,
          ) / storeMetrics.size
        : 0;

    couponResult = await resolveCouponForOrder({
      userId,
      couponId,
      subtotalUSD: subtotal,
      shippingUSD: shippingFee,
    });

    if ("error" in couponResult) {
      return { error: couponResult.error };
    }

    discountAmount = couponResult.discountAmount ?? 0;
    totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

    if (paymentMethod === "WALLET") {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!wallet) {
        return {
          error:
            "Insufficient wallet balance. Please choose another payment method.",
        };
      }

      const availableWalletBalance = await calculateWalletBalance(wallet.id);

      if (availableWalletBalance < totalAmount) {
        return {
          error:
            "Insufficient wallet balance. Please choose another payment method.",
        };
      }
    }
  } catch (error) {
    if (error instanceof PlaceOrderError) {
      return { error: error.message };
    }

    console.error("Checkout pre-validation failed:", error);
    return { error: "Checkout failed. Please try again." };
  }

  if (!address || !couponResult || "error" in couponResult) {
    return { error: "Checkout failed. Please try again." };
  }

  const validatedCouponResult = couponResult;

  const trackingNumber = generateTrackingNumber();
  const systemEscrowWalletId =
    paymentMethod === "WALLET" ? await getOrCreateSystemEscrowWallet() : null;

  let order: Order;
  let walletJustPaid = false;
  let walletPaidOrderId: string | null = null;

  try {
    order = await prisma.$transaction(async (tx) => {
      if (paymentMethod === "WALLET") {
        const wallet = await tx.wallet.upsert({
          where: { userId },
          update: {},
          create: { userId },
          select: { id: true },
        });

        const availableWalletBalance = await calculateWalletBalance(
          wallet.id,
          tx,
        );

        if (availableWalletBalance < totalAmount) {
          throw new PlaceOrderError(
            "Insufficient wallet balance. Please choose another payment method.",
          );
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
          couponId: validatedCouponResult.coupon?.id ?? null,
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
            ...buildSellerGroupCodes(createdOrder.id, storeId),
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

      if (validatedCouponResult.coupon?.id) {
        await tx.couponUsage.create({
          data: {
            couponId: validatedCouponResult.coupon.id,
            userId,
            orderId: createdOrder.id,
          },
        });

        await tx.coupon.update({
          where: { id: validatedCouponResult.coupon.id },
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
        where: { id: { in: snapshotCartItemIds } },
      });

      if (paymentMethod === "WALLET") {
        if (!systemEscrowWalletId) {
          throw new PlaceOrderError("Wallet payment setup failed.");
        }

        const paymentResult = await completeOrderPaymentCore({
          tx,
          orderId: createdOrder.id,
          paymentReference: `wallet-order-${createdOrder.id}`,
          method: "WALLET",
          systemEscrowWalletId,
        });

        walletJustPaid = paymentResult.justPaid;
        walletPaidOrderId = paymentResult.order.id;
      }

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
      if (walletPaidOrderId !== order.id) {
        return { error: "Wallet payment validation failed. Please try again." };
      }

      await completeOrderPaymentSideEffects(order.id);

      if (walletJustPaid) {
        await applyReferralRewardsForPaidOrder(order.id);
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
