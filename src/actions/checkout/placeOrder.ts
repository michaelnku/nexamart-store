"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { DeliveryType, PaymentMethod, Prisma } from "@/generated/prisma/client";
import { generateTrackingNumber } from "@/components/helper/generateTrackingNumber";
import { resolveCouponForOrder } from "@/lib/coupons/resolveCouponForOrder";
import { applyReferralRewardsForPaidOrder } from "@/lib/referrals/applyReferralRewards";
import {
  completeOrderPaymentCore,
  completeOrderPaymentSideEffects,
} from "@/lib/payments/completeOrderPayment";
import { calculateDrivingDistance } from "@/lib/shipping/mapboxDistance";
import { calculateStoreDeliveryFee } from "@/lib/shipping/shippingCalculator";
import { calculateWalletBalance } from "@/lib/ledger/calculateWalletBalance";
import { getOrCreateSystemEscrowWallet } from "@/lib/ledger/systemEscrowWallet";
import { buildDoubleEntryLedgerRows } from "@/lib/finance/ledgerService";

type StoreGroup = {
  storeId: string;
  sellerId: string;
  storeName: string;
  storeType: "FOOD" | "GENERAL";
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    priceUSD: number;
  }>;
  subtotal: number;
  shippingFee: number;
  distanceInMiles: number;
};

type InternalOrderGroup = {
  isFoodOrder: boolean;
  stores: StoreGroup[];
  subtotal: number;
  shippingFee: number;
  distanceInMiles: number;
  totalAmount: number;
};

class PlaceOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaceOrderError";
  }
}

function buildSellerGroupCodes(orderId: string, storeId: string) {
  const seed = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const storeSeed = storeId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  const orderSeed = orderId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();

  return {
    hubInboundCode: `HUB-${storeSeed}-${seed}`,
    internalTrackingNumber: `SG-${orderSeed}-${seed}`,
  };
}

function splitDiscountAcrossGroups(
  groups: Array<{ baseAmount: number }>,
  totalDiscount: number,
) {
  if (groups.length === 0 || totalDiscount <= 0) {
    return groups.map(() => 0);
  }

  const totalBase = groups.reduce((sum, group) => sum + group.baseAmount, 0);
  if (totalBase <= 0) {
    return groups.map(() => 0);
  }

  const rawDiscounts = groups.map(
    (group) => (group.baseAmount / totalBase) * totalDiscount,
  );
  const floored = rawDiscounts.map((value) => Math.floor(value * 100) / 100);
  const flooredTotal = floored.reduce((sum, value) => sum + value, 0);
  let remainder = Math.round((totalDiscount - flooredTotal) * 100);

  const sortedIndexes = rawDiscounts
    .map((value, index) => ({ index, frac: value - floored[index] }))
    .sort((a, b) => b.frac - a.frac)
    .map((entry) => entry.index);

  for (let i = 0; i < remainder; i += 1) {
    const idx = sortedIndexes[i % sortedIndexes.length];
    floored[idx] += 0.01;
  }

  return floored;
}

export async function placeOrderAction({
  addressId,
  paymentMethod,
  deliveryType,
  distanceInMiles: _distanceInMiles,
  couponId,
  idempotencyKey,
  __internalUserId,
  __internalAuthToken,
}: {
  addressId: string;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  distanceInMiles?: number;
  couponId?: string | null;
  idempotencyKey: string;
  __internalUserId?: string;
  __internalAuthToken?: string;
}) {
  const isTrustedInternalCall =
    !!process.env.STRIPE_WEBHOOK_SECRET &&
    __internalAuthToken === process.env.STRIPE_WEBHOOK_SECRET;
  const userId =
    isTrustedInternalCall && __internalUserId
      ? __internalUserId
      : await CurrentUserId();
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
      return { error: "Checkout failed. Please try again." };
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
                  name: true,
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

  const itemsByStore = new Map<string, typeof cart.items>();

  for (const item of cart.items) {
    const storeId = item.product.store.id;
    if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
    itemsByStore.get(storeId)!.push(item);
  }

  const checkoutSubtotal = cart.items.reduce(
    (s, i) => s + i.quantity * i.variant!.priceUSD,
    0,
  );
  const snapshotCartItemIds = cart.items.map((item) => item.id);

  let address: Awaited<ReturnType<typeof prisma.address.findFirst>>;
  let storeGroups: StoreGroup[] = [];
  let orderGroups: InternalOrderGroup[] = [];
  let checkoutShippingFee = 0;
  let checkoutDistanceInMiles = 0;
  let couponResult: Awaited<ReturnType<typeof resolveCouponForOrder>>;
  let checkoutDiscountAmount = 0;
  let checkoutTotalAmount = 0;

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
    const isPickupDelivery =
      deliveryType === "STORE_PICKUP" || deliveryType === "STATION_PICKUP";

    if (
      !isPickupDelivery &&
      (address.latitude == null || address.longitude == null)
    ) {
      return {
        error:
          "Selected address is missing coordinates. Please update address.",
      };
    }

    const siteConfig = await prisma.siteConfiguration.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        foodMinimumDeliveryFee: true,
        generalMinimumDeliveryFee: true,
        foodBaseDeliveryRate: true,
        foodRatePerMile: true,
        generalBaseDeliveryRate: true,
        generalRatePerMile: true,
        expressMultiplier: true,
        pickupFee: true,
      },
    });

    const storeEntries = await Promise.all(
      Array.from(itemsByStore.entries()).map(async ([storeId, items]) => {
        const store = items[0].product.store;
        let shippingFee = 0;
        let distanceInMiles = 0;

        if (!isPickupDelivery) {
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

          distanceInMiles = distance.distanceInMiles;
          shippingFee = calculateStoreDeliveryFee({
            distanceInMiles,
            storeType: store.type,
            storeRatePerMile: store.shippingRatePerMile,
            deliveryType,
            config: siteConfig,
          });
        }

        return {
          storeId,
          sellerId: store.userId,
          storeName: store.name,
          storeType: store.type,
          items: items.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId!,
            quantity: item.quantity,
            priceUSD: item.variant!.priceUSD,
          })),
          subtotal: items.reduce(
            (sum, item) => sum + item.quantity * item.variant!.priceUSD,
            0,
          ),
          shippingFee,
          distanceInMiles,
        } satisfies StoreGroup;
      }),
    );

    storeGroups = storeEntries;

    const foodStoreGroups = storeGroups.filter(
      (group) => group.storeType === "FOOD",
    );
    const nonFoodStoreGroups = storeGroups.filter(
      (group) => group.storeType !== "FOOD",
    );

    orderGroups = [
      ...foodStoreGroups.map((storeGroup) => ({
        isFoodOrder: true,
        stores: [storeGroup],
        subtotal: storeGroup.subtotal,
        shippingFee: storeGroup.shippingFee,
        distanceInMiles: storeGroup.distanceInMiles,
        totalAmount: 0,
      })),
      ...(nonFoodStoreGroups.length
        ? [
            {
              isFoodOrder: false,
              stores: nonFoodStoreGroups,
              subtotal: nonFoodStoreGroups.reduce(
                (sum, group) => sum + group.subtotal,
                0,
              ),
              shippingFee: nonFoodStoreGroups.reduce(
                (sum, group) => sum + group.shippingFee,
                0,
              ),
              distanceInMiles:
                nonFoodStoreGroups.reduce(
                  (sum, group) => sum + group.distanceInMiles,
                  0,
                ) / nonFoodStoreGroups.length,
              totalAmount: 0,
            } satisfies InternalOrderGroup,
          ]
        : []),
    ];

    if (orderGroups.length === 0) {
      return { error: "No valid order groups were found in cart." };
    }

    if (isPickupDelivery) {
      checkoutShippingFee = siteConfig?.pickupFee ?? 0;
      checkoutDistanceInMiles = 0;

      if (checkoutShippingFee > 0) {
        const subtotalBase = orderGroups.reduce(
          (sum, group) => sum + group.subtotal,
          0,
        );

        const shippingAllocations =
          subtotalBase > 0
            ? splitDiscountAcrossGroups(
                orderGroups.map((group) => ({ baseAmount: group.subtotal })),
                checkoutShippingFee,
              )
            : orderGroups.map((_, index) =>
                index === 0 ? checkoutShippingFee : 0,
              );

        orderGroups = orderGroups.map((group, index) => ({
          ...group,
          shippingFee: shippingAllocations[index],
          distanceInMiles: 0,
        }));
      } else {
        orderGroups = orderGroups.map((group) => ({
          ...group,
          shippingFee: 0,
          distanceInMiles: 0,
        }));
      }
    } else {
      checkoutShippingFee = orderGroups.reduce(
        (sum, group) => sum + group.shippingFee,
        0,
      );
      checkoutDistanceInMiles =
        orderGroups.reduce((sum, group) => sum + group.distanceInMiles, 0) /
        orderGroups.length;
    }

    couponResult = await resolveCouponForOrder({
      userId,
      couponId,
      subtotalUSD: checkoutSubtotal,
      shippingUSD: checkoutShippingFee,
    });

    if ("error" in couponResult) {
      return { error: couponResult.error };
    }

    checkoutDiscountAmount = couponResult.discountAmount ?? 0;
    checkoutTotalAmount = Math.max(
      0,
      checkoutSubtotal + checkoutShippingFee - checkoutDiscountAmount,
    );

    const discountAllocations = splitDiscountAcrossGroups(
      orderGroups.map((group) => ({
        baseAmount: group.subtotal + group.shippingFee,
      })),
      checkoutDiscountAmount,
    );

    orderGroups = orderGroups.map((group, index) => ({
      ...group,
      totalAmount: Math.max(
        0,
        group.subtotal + group.shippingFee - discountAllocations[index],
      ),
    }));

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

      if (availableWalletBalance < checkoutTotalAmount) {
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

  const systemEscrowWalletId =
    paymentMethod === "WALLET" ? await getOrCreateSystemEscrowWallet() : null;

  let createdOrders: Array<{
    id: string;
    status: string;
    trackingNumber: string | null;
    isFoodOrder: boolean;
    sellerGroups: Array<{
      id: string;
      sellerId: string;
      storeId: string;
      subtotal: number;
      shippingFee: number;
      storeName: string;
    }>;
  }> = [];
  let checkoutGroupId: string | null = null;
  let walletJustPaid = false;
  const paidOrderIds: string[] = [];
  let postCommitLedgerRows: Prisma.LedgerEntryCreateManyInput[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      let checkoutGroup: { id: string } | null = null;

      if (orderGroups.length > 1) {
        checkoutGroup = await tx.checkoutGroup.create({
          data: {
            userId,
            total: checkoutTotalAmount,
          },
          select: { id: true },
        });
      }

      checkoutGroupId = checkoutGroup?.id ?? null;

      for (const group of orderGroups) {
        const createdOrder = await tx.order.create({
          data: {
            userId,
            checkoutGroupId: checkoutGroup?.id ?? null,
            deliveryFullName: address.fullName,
            deliveryPhone: address.phone,
            deliveryStreet: address.street,
            deliveryCity: address.city,
            deliveryState: address.state ?? "",
            deliveryCountry: address.country,
            deliveryPostal: address.postalCode ?? "",
            paymentMethod,
            deliveryType,
            distanceInMiles: group.distanceInMiles || checkoutDistanceInMiles,
            shippingFee: group.shippingFee,
            totalAmount: group.totalAmount,
            isPaid: false,
            isFoodOrder: group.isFoodOrder,
            couponId: validatedCouponResult.coupon?.id ?? null,
            discountAmount:
              group.subtotal + group.shippingFee - group.totalAmount > 0
                ? group.subtotal + group.shippingFee - group.totalAmount
                : null,
            trackingNumber: generateTrackingNumber(),
            status: "PENDING_PAYMENT",
          },
        });

        const sellerGroups = [];
        for (const storeGroup of group.stores) {
          const createdSellerGroup = await tx.orderSellerGroup.create({
            data: {
              orderId: createdOrder.id,
              storeId: storeGroup.storeId,
              sellerId: storeGroup.sellerId,
              subtotal: storeGroup.subtotal,
              shippingFee: storeGroup.shippingFee,
              ...buildSellerGroupCodes(createdOrder.id, storeGroup.storeId),
            },
            select: {
              id: true,
              sellerId: true,
              storeId: true,
              subtotal: true,
              shippingFee: true,
            },
          });

          await tx.orderItem.createMany({
            data: storeGroup.items.map((item) => ({
              orderId: createdOrder.id,
              sellerGroupId: createdSellerGroup.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.priceUSD,
            })),
          });

          sellerGroups.push({
            ...createdSellerGroup,
            storeName: storeGroup.storeName,
          });
        }

        await tx.delivery.create({
          data: {
            orderId: createdOrder.id,
            status: "PENDING_ASSIGNMENT",
            fee: group.shippingFee,
            deliveryAddress: [
              createdOrder.deliveryStreet,
              createdOrder.deliveryCity,
              createdOrder.deliveryState,
              createdOrder.deliveryCountry,
              createdOrder.deliveryPostal,
            ]
              .filter((part) => Boolean(part && part.trim()))
              .join(", "),
            distance: group.distanceInMiles || checkoutDistanceInMiles,
          },
        });

        createdOrders.push({
          id: createdOrder.id,
          status: createdOrder.status,
          trackingNumber: createdOrder.trackingNumber,
          isFoodOrder: createdOrder.isFoodOrder,
          sellerGroups,
        });
      }

      if (validatedCouponResult.coupon?.id) {
        await tx.couponUsage.create({
          data: {
            couponId: validatedCouponResult.coupon.id,
            userId,
            orderId: createdOrders[0]?.id,
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
          data: { orderId: createdOrders[0]?.id ?? null },
        });
      } else {
        await tx.idempotencyKey.create({
          data: {
            key: idempotencyKey,
            userId,
            orderId: createdOrders[0]?.id ?? null,
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { id: { in: snapshotCartItemIds } },
      });
    });
  } catch (error) {
    if (error instanceof PlaceOrderError) {
      return { error: error.message };
    }

    console.error("Place order transaction failed:", error);
    return { error: "Checkout failed. Please try again." };
  }

  if (paymentMethod === "WALLET") {
    if (!systemEscrowWalletId) {
      return { error: "Wallet payment setup failed." };
    }

    const parentReference = `wallet-checkout-${checkoutGroupId ?? createdOrders[0]?.id}`;
    const createdOrderIds = createdOrders.map((order) => order.id);

    const existingParentTransaction = await prisma.transaction.findUnique({
      where: { reference: parentReference },
      select: { id: true },
    });

    if (existingParentTransaction) {
      const alreadyPaid = await prisma.order.findMany({
        where: { id: { in: createdOrderIds }, isPaid: true },
        select: { id: true },
      });

      if (alreadyPaid.length !== createdOrderIds.length) {
        return {
          error: "Checkout payment is processing. Please retry in a moment.",
        };
      }

      paidOrderIds.push(...alreadyPaid.map((order) => order.id));
    } else {
      try {
        await prisma.$transaction(async (tx) => {
          const ordersForSettlement = await tx.order.findMany({
            where: { id: { in: createdOrderIds } },
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
            throw new PlaceOrderError(
              "Order settlement payload is incomplete.",
            );
          }

          for (const order of ordersForSettlement) {
            if (order.isPaid || order.status !== "PENDING_PAYMENT") {
              throw new PlaceOrderError(
                "Order already settled or in invalid status for payment.",
              );
            }
          }

          const walletForPayment = await tx.wallet.upsert({
            where: { userId },
            update: {},
            create: { userId },
            select: { id: true, balance: true },
          });

          if (walletForPayment.balance < checkoutTotalAmount) {
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

          await Promise.all([
            tx.wallet.update({
              where: { id: walletForPayment.id },
              data: { balance: { decrement: checkoutTotalAmount } },
            }),
            tx.wallet.update({
              where: { id: systemEscrowWalletId },
              data: { balance: { increment: checkoutTotalAmount } },
            }),
          ]);

          const preparedLedger = buildDoubleEntryLedgerRows({
            fromUserId: userId,
            fromWalletId: walletForPayment.id,
            toWalletId: systemEscrowWalletId,
            entryType: "ESCROW_DEPOSIT",
            amount: checkoutTotalAmount,
            reference: `escrow-fund-${checkoutGroupId ?? createdOrderIds[0]}`,
          });
          postCommitLedgerRows = preparedLedger.rows;

          for (const order of ordersForSettlement) {
            const orderPaymentReference = `${parentReference}-order-${order.id}`;
            const paymentResult = await completeOrderPaymentCore({
              tx,
              orderId: order.id,
              checkoutGroupId,
              paymentReference: orderPaymentReference,
              method: "WALLET",
              systemEscrowWalletId,
              preloadedOrder: {
                id: order.id,
                userId: order.userId,
                paymentMethod: (order.paymentMethod ??
                  "WALLET") as PaymentMethod,
                status: order.status,
                isPaid: order.isPaid,
                postPaymentFinalized: order.postPaymentFinalized,
                totalAmount: order.totalAmount,
                sellerGroups: order.sellerGroups,
              },
              preloadedWallet: walletForPayment,
              assumePaymentReferenceFresh: true,
              skipWalletBalanceCheck: true,
              skipWalletLedgerTransfer: true,
            });

            if (paymentResult.justPaid) {
              walletJustPaid = true;
              paidOrderIds.push(paymentResult.order.id);
            }
          }
        });
      } catch (error) {
        if (error instanceof PlaceOrderError) {
          return { error: error.message };
        }
        console.error("Wallet settlement transaction failed:", error);
        return { error: "Wallet payment failed. Please try again." };
      }
    }
  }

  try {
    await prisma.orderTimeline.createMany({
      data: createdOrders.map((order) => ({
        orderId: order.id,
        status: "PENDING_PAYMENT",
        message: "Order placed successfully",
      })),
    });

    await prisma.notification.createMany({
      data: [
        {
          userId,
          title: "Order Confirmed",
          message:
            createdOrders.length > 1
              ? `Your ${createdOrders.length} orders were placed successfully`
              : `Your order ${createdOrders[0]?.trackingNumber ?? ""} was placed successfully`,
        },
        ...storeGroups.map((group) => ({
          userId: group.sellerId,
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
      if (paidOrderIds.length !== createdOrders.length) {
        return { error: "Wallet payment validation failed. Please try again." };
      }

      if (postCommitLedgerRows.length) {
        try {
          await prisma.ledgerEntry.createMany({
            data: postCommitLedgerRows,
            skipDuplicates: true,
          });
        } catch (error) {
          console.error("Post-commit ledger write failed:", error);
        }
      }

      for (const order of createdOrders) {
        await completeOrderPaymentSideEffects(order.id);
      }

      if (walletJustPaid) {
        for (const orderId of paidOrderIds) {
          await applyReferralRewardsForPaidOrder(orderId);
        }
      }
    } catch (error) {
      console.error("Failed to complete wallet order payment:", error);
      return { error: "Wallet payment failed. Please try again." };
    }
  }

  return {
    success: true,
    orderId: createdOrders[0]?.id,
    trackingNumber: createdOrders[0]?.trackingNumber,
    checkoutGroupId,
    totalAmount: checkoutTotalAmount,
    orders: createdOrders.map((order) => ({
      orderId: order.id,
      sellerName: order.sellerGroups.map((group) => group.storeName).join(", "),
    })),
  };
}
