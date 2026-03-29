"use server";

import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import { DeliveryType, PaymentMethod } from "@/generated/prisma/client";
import { resolveAuthoritativeCartLines } from "@/lib/checkout/cartPricing";
import { getOrderPricingSiteConfig } from "@/lib/site-config/siteConfig.order";
import { PlaceOrderError } from "@/lib/checkout/place-order/placeOrder.errors";
import { findExistingIdempotentOrder } from "@/lib/checkout/place-order/findExistingIdempotentOrder";
import { loadCheckoutCartForOrder } from "@/lib/checkout/place-order/loadCheckoutCartForOrder";
import { loadValidatedOrderAddress } from "@/lib/checkout/place-order/loadValidatedOrderAddress";
import { buildStoreGroups } from "@/lib/checkout/place-order/buildStoreGroups";
import { buildInternalOrderGroups } from "@/lib/checkout/place-order/buildInternalOrderGroups";
import { applyPickupOrDeliveryAllocation } from "@/lib/checkout/place-order/applyPickupOrDeliveryAllocation";
import { resolveCheckoutCouponAndPayoutBasis } from "@/lib/checkout/place-order/resolveCheckoutCouponAndPayoutBasis";
import { validateWalletCheckout } from "@/lib/checkout/place-order/validateWalletCheckout";
import { createOrdersTransaction } from "@/lib/checkout/place-order/createOrdersTransaction";
import { runWalletSettlement } from "@/lib/checkout/place-order/runWalletSettlement";
import { runPostOrderNotifications } from "@/lib/checkout/place-order/runPostOrderNotifications";
import { runWalletPostPaymentEffects } from "@/lib/checkout/place-order/runWalletPostPaymentEffects";
import type {
  CreatedOrdersPayload,
  InternalOrderGroup,
  StoreGroup,
  ValidatedOrderAddress,
} from "@/lib/checkout/place-order/placeOrder.types";

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

  type ExistingKeyState = Awaited<
    ReturnType<typeof findExistingIdempotentOrder>
  >["existingKey"];
  type ResolvedCouponAndPayoutSuccess = Exclude<
    Awaited<ReturnType<typeof resolveCheckoutCouponAndPayoutBasis>>,
    { error: string }
  >;

  let existingKey: ExistingKeyState = null;

  try {
    const existingIdempotent = await findExistingIdempotentOrder({
      idempotencyKey,
      userId,
    });

    if (existingIdempotent.result) {
      return existingIdempotent.result;
    }

    existingKey = existingIdempotent.existingKey;
  } catch (error) {
    if (error instanceof PlaceOrderError) {
      return { error: error.message };
    }

    console.error("Idempotency lookup failed:", error);
    return { error: "Checkout failed. Please try again." };
  }

  if (existingKey && existingKey.userId !== userId) {
    return { error: "Invalid checkout request. Please refresh and try again." };
  }

  const cart = await loadCheckoutCartForOrder(userId);

  if (!cart || cart.items.length === 0) {
    return { error: "Cart is empty" };
  }

  let pricedCartItems: Awaited<ReturnType<typeof resolveAuthoritativeCartLines>>;
  try {
    pricedCartItems = await resolveAuthoritativeCartLines(prisma, cart.items);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed. Please try again.";
    return { error: message };
  }

  const checkoutSubtotal = pricedCartItems.reduce(
    (s, i) => s + i.lineTotalUSD,
    0,
  );

  let address: ValidatedOrderAddress | undefined;
  let storeGroups: StoreGroup[] = [];
  let orderGroups: InternalOrderGroup[] = [];
  let checkoutShippingFee = 0;
  let checkoutDistanceInMiles = 0;
  let validatedCouponResult:
    | ResolvedCouponAndPayoutSuccess["couponResult"]
    | undefined;
  let checkoutTotalAmount = 0;

  try {
    const addressResult = await loadValidatedOrderAddress({
      addressId,
      userId,
      deliveryType,
    });

    if ("error" in addressResult) {
      return { error: addressResult.error };
    }

    address = addressResult.address;

    const pricingConfig = await getOrderPricingSiteConfig();

    storeGroups = await buildStoreGroups({
      pricedCartItems,
      address,
      deliveryType,
      pricingConfig,
    });

    orderGroups = buildInternalOrderGroups(storeGroups);

    if (orderGroups.length === 0) {
      return { error: "No valid order groups were found in cart." };
    }

    const allocation = applyPickupOrDeliveryAllocation({
      orderGroups,
      deliveryType,
      pricingConfig,
    });

    orderGroups = allocation.orderGroups;
    checkoutShippingFee = allocation.checkoutShippingFee;
    checkoutDistanceInMiles = allocation.checkoutDistanceInMiles;

    const couponAndPayout = await resolveCheckoutCouponAndPayoutBasis({
      userId,
      couponId,
      checkoutSubtotal,
      checkoutShippingFee,
      orderGroups,
    });

    if ("error" in couponAndPayout) {
      return { error: couponAndPayout.error };
    }

    validatedCouponResult = couponAndPayout.couponResult;
    checkoutTotalAmount = couponAndPayout.checkoutTotalAmount;
    orderGroups = couponAndPayout.orderGroups;

    if (paymentMethod === "WALLET") {
      const walletValidation = await validateWalletCheckout({
        userId,
        checkoutTotalAmount,
      });

      if ("error" in walletValidation) {
        return { error: walletValidation.error };
      }
    }
  } catch (error) {
    if (error instanceof PlaceOrderError) {
      return { error: error.message };
    }

    console.error("Checkout pre-validation failed:", error);
    return { error: "Checkout failed. Please try again." };
  }

  if (!address || !validatedCouponResult) {
    return { error: "Checkout failed. Please try again." };
  }

  let createdOrders: CreatedOrdersPayload = [];
  let checkoutGroupId: string | null = null;
  let walletJustPaid = false;
  const paidOrderIds: string[] = [];

  try {
    const created = await createOrdersTransaction({
      userId,
      address,
      paymentMethod,
      deliveryType,
      checkoutDistanceInMiles,
      checkoutTotalAmount,
      orderGroups,
      validatedCouponResult,
      idempotencyKey,
    });

    createdOrders = created.createdOrders;
    checkoutGroupId = created.checkoutGroupId;
  } catch (error) {
    if (error instanceof PlaceOrderError) {
      return { error: error.message };
    }

    console.error("Place order transaction failed:", error);
    return { error: "Checkout failed. Please try again." };
  }

  if (paymentMethod === "WALLET") {
    try {
      const settlement = await runWalletSettlement({
        userId,
        checkoutGroupId,
        createdOrders,
        checkoutTotalAmount,
      });

      walletJustPaid = settlement.walletJustPaid;
      paidOrderIds.push(...settlement.paidOrderIds);
    } catch (error) {
      if (error instanceof PlaceOrderError) {
        return { error: error.message };
      }
      console.error("Wallet settlement transaction failed:", error);
      return { error: "Wallet payment failed. Please try again." };
    }
  }

  try {
    await runPostOrderNotifications({
      userId,
      createdOrders,
      storeGroups,
    });
  } catch (error) {
    console.error("Post-order side effects failed:", error);
  }

  if (paymentMethod === "WALLET") {
    try {
      const walletEffects = await runWalletPostPaymentEffects({
        paidOrderIds,
        createdOrders,
        walletJustPaid,
      });

      if ("error" in walletEffects) {
        return { error: walletEffects.error };
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
