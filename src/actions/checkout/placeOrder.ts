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
import { reserveOrderInventoryInTx } from "@/lib/inventory/reservationService";
import { getOrCreateSystemEscrowWallet } from "@/lib/ledger/systemEscrowWallet";
import { TREASURY_LEDGER_ROUTING } from "@/lib/ledger/treasurySubledgers";
import { createDoubleEntryLedger } from "@/lib/finance/ledgerService";
import { calculatePlatformCommission } from "@/lib/finance/calculatePlatformCommission";
import { pusherServer } from "@/lib/pusher";
import { createSellerOrderNotification } from "@/lib/notifications/createSellerOrderNotification";
import { createNotification } from "@/lib/notifications/createNotification";
import { buildAuthoritativePayoutBasis } from "@/lib/payout/payoutBasis";
import { resolveAuthoritativeCartLines } from "@/lib/checkout/cartPricing";

type StoreGroup = {
  storeId: string;
  sellerId: string;
  sellerRevenue: number;
  platformCommission: number;
  commissionRate: number;
  storeName: string;
  storeType: "FOOD" | "GENERAL";
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    priceUSD: number;
    basePriceUSD: number;
    optionsPriceUSD: number;
    lineTotalUSD: number;
    selectedOptions: Array<{
      optionGroupName: string;
      optionName: string;
      priceDeltaUSD: number;
    }>;
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
  riderPayoutAmount: number;
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
          cartItemSelectedOptions: {
            select: {
              optionGroupId: true,
              optionId: true,
            },
          },
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
              foodProductConfig: {
                select: {
                  inventoryMode: true,
                  isAvailable: true,
                  isSoldOut: true,
                  dailyOrderLimit: true,
                  availableFrom: true,
                  availableUntil: true,
                  availableDays: true,
                },
              },
              foodOptionGroups: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  type: true,
                  isRequired: true,
                  minSelections: true,
                  maxSelections: true,
                  isActive: true,
                  options: {
                    select: {
                      id: true,
                      name: true,
                      priceDeltaUSD: true,
                      isAvailable: true,
                      stock: true,
                    },
                  },
                },
              },
            },
          },
          variant: {
            select: {
              id: true,
              stock: true,
              priceUSD: true,
              color: true,
              size: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Cart is empty" };
  }

  let pricedCartItems;
  try {
    pricedCartItems = await resolveAuthoritativeCartLines(prisma, cart.items);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed. Please try again.";
    return { error: message };
  }

  const itemsByStore = new Map<string, typeof pricedCartItems>();

  for (const item of pricedCartItems) {
    const storeId = item.product.store.id;
    if (!itemsByStore.has(storeId)) itemsByStore.set(storeId, []);
    itemsByStore.get(storeId)!.push(item);
  }

  const checkoutSubtotal = pricedCartItems.reduce(
    (s, i) => s + i.lineTotalUSD,
    0,
  );

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
        platformCommissionRate: true,
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

        const subtotal = items.reduce(
          (sum, item) => sum + item.lineTotalUSD,
          0,
        );

        const commissionRate = siteConfig?.platformCommissionRate ?? 0.1;

        const { platformCommission, sellerRevenue } =
          calculatePlatformCommission(subtotal, commissionRate);

        return {
          storeId,
          sellerId: store.userId!,
          storeName: store.name!,
          storeType: store.type,
          commissionRate,

          items: items.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId!,
            quantity: item.quantity,
            priceUSD: item.unitPriceUSD,
            basePriceUSD: item.basePriceUSD,
            optionsPriceUSD: item.optionsPriceUSD,
            lineTotalUSD: item.lineTotalUSD,
            selectedOptions: item.selectedOptions.map((selection) => ({
              optionGroupName: selection.optionGroupName,
              optionName: selection.optionName,
              priceDeltaUSD: selection.priceDeltaUSD,
            })),
          })),

          subtotal,

          sellerRevenue,
          platformCommission,

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
        riderPayoutAmount: storeGroup.shippingFee,
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
              riderPayoutAmount: nonFoodStoreGroups.reduce(
                (sum, group) => sum + group.shippingFee,
                0,
              ),
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

    orderGroups = buildAuthoritativePayoutBasis({
      orderGroups,
      couponType: couponResult.coupon?.type ?? null,
      totalDiscountAmount: checkoutDiscountAmount,
    });

    if (paymentMethod === "WALLET") {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: { id: true, status: true },
      });

      if (!wallet || wallet.status !== "ACTIVE") {
        return {
          error: "Activate your wallet before paying with it.",
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
              sellerRevenue: storeGroup.sellerRevenue,
              platformCommission: storeGroup.platformCommission,
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

          for (const item of storeGroup.items) {
            const createdOrderItem = await tx.orderItem.create({
              data: {
                orderId: createdOrder.id,
                sellerGroupId: createdSellerGroup.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.priceUSD,
                basePrice: item.basePriceUSD,
                optionsPrice: item.optionsPriceUSD,
                lineTotal: item.lineTotalUSD,
              },
              select: {
                id: true,
              },
            });

            if (item.selectedOptions.length > 0) {
              await tx.orderItemSelectedOption.createMany({
                data: item.selectedOptions.map((selection) => ({
                  orderItemId: createdOrderItem.id,
                  optionGroupName: selection.optionGroupName,
                  optionName: selection.optionName,
                  priceDeltaUSD: selection.priceDeltaUSD,
                })),
              });
            }
          }

          sellerGroups.push({
            ...createdSellerGroup,
            storeName: storeGroup.storeName,
          });
        }

        await reserveOrderInventoryInTx(tx, createdOrder.id);

        await tx.delivery.create({
          data: {
            orderId: createdOrder.id,
            status: "PENDING_ASSIGNMENT",
            fee: group.shippingFee,
            riderPayoutAmount: group.riderPayoutAmount,
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
    });
  } catch (error) {
    if (error instanceof PlaceOrderError) {
      return { error: error.message };
    }

    console.error("Place order transaction failed:", error);
    return { error: "Checkout failed. Please try again." };
  }

  if (paymentMethod === "WALLET") {
    const parentReference = `wallet-checkout-${checkoutGroupId ?? createdOrders[0]?.id}`;
    const createdOrderIds = createdOrders.map((order) => order.id);
    type WalletSettlementOrderPayload = NonNullable<
      Parameters<typeof completeOrderPaymentCore>[0]["preloadedOrder"]
    >;
    type WalletSettlementWalletPayload = NonNullable<
      Parameters<typeof completeOrderPaymentCore>[0]["preloadedWallet"]
    >;

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

    try {
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
    } catch (error) {
      if (error instanceof PlaceOrderError) {
        return { error: error.message };
      }
      console.error("Wallet settlement transaction failed:", error);
      return { error: "Wallet payment failed. Please try again." };
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

    await createNotification({
      userId,
      title: "Order Confirmed",
      message:
        createdOrders.length > 1
          ? `Your ${createdOrders.length} orders were placed successfully`
          : `Your order ${createdOrders[0]?.trackingNumber ?? ""} was placed successfully`,
      link: `/customer/order/${createdOrders[0]?.id}`,
      event: "ORDER_CREATED",
      key: `order-confirm-${createdOrders[0]?.id}-${userId}`,
    });

    const uniqueSellerIds = [...new Set(storeGroups.map((g) => g.sellerId))];

    for (const sellerId of uniqueSellerIds) {
      await createSellerOrderNotification(sellerId, createdOrders[0]?.id);
    }

    await Promise.all([
      pusherServer.trigger(`notifications-${userId}`, "new-notification", {
        title: "Order Confirmed",
        message:
          createdOrders.length > 1
            ? `Your ${createdOrders.length} orders were placed successfully`
            : `Your order ${createdOrders[0]?.trackingNumber ?? ""} was placed successfully`,
      }),

      ...uniqueSellerIds.map((sellerId) =>
        pusherServer.trigger(`notifications-${sellerId}`, "new-notification", {
          title: "New Orders",
          message: "You received a new order",
        }),
      ),
    ]);
  } catch (error) {
    console.error("Post-order side effects failed:", error);
  }

  if (paymentMethod === "WALLET") {
    try {
      const uniquePaidOrderIds = [...new Set(paidOrderIds)];
      if (uniquePaidOrderIds.length !== createdOrders.length) {
        return { error: "Wallet payment validation failed. Please try again." };
      }

      for (const order of createdOrders) {
        await completeOrderPaymentSideEffects(order.id);
      }

      if (walletJustPaid) {
        for (const orderId of uniquePaidOrderIds) {
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
