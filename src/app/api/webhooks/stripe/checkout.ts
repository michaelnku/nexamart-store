import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { DeliveryType } from "@/generated/prisma/client";
import { placeOrderAction } from "@/actions/checkout/placeOrder";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { applyReferralRewardsForPaidOrder } from "@/lib/referrals/applyReferralRewards";
import { completeOrderPayment } from "@/lib/payments/completeOrderPayment";
import { createServiceContext } from "@/lib/system/serviceContext";

function isDeliveryType(value: string): value is DeliveryType {
  return (
    value === "HOME_DELIVERY" ||
    value === "EXPRESS_DELIVERY" ||
    value === "STORE_PICKUP" ||
    value === "STATION_PICKUP"
  );
}

async function settleCreatedOrders({
  orderId,
  checkoutGroupId,
  paymentIntentId,
}: {
  orderId: string;
  checkoutGroupId?: string | null;
  paymentIntentId: string;
}) {
  const context = createServiceContext("ORDER_PAYMENT_WEBHOOK");

  const targetOrders = checkoutGroupId
    ? await prisma.order.findMany({
        where: { checkoutGroupId },
        select: { id: true },
      })
    : [{ id: orderId }];

  for (const target of targetOrders) {
    try {
      const paymentResult = await completeOrderPayment({
        orderId: target.id,
        paymentReference: `order-payment-${paymentIntentId}-${target.id}`,
        method: "CARD",
        context,
      });

      if (!paymentResult.justPaid) {
        continue;
      }

      const paidOrder = paymentResult.order;

      await prisma.product.updateMany({
        where: {
          id: {
            in: await prisma.orderItem
              .findMany({
                where: { orderId: paidOrder.id },
                select: { productId: true },
              })
              .then((items) => items.map((item) => item.productId)),
          },
        },
        data: { isPublished: true },
      });

      await pusherServer.trigger(
        `user-${paidOrder.userId}`,
        "payment-success",
        {
          orderId: target.id,
          message: "Payment received! Your order is now processing.",
        },
      );

      for (const group of paidOrder.sellerGroups) {
        await pusherServer.trigger(`seller-${group.sellerId}`, "new-order", {
          orderId: target.id,
          storeId: group.storeId,
          subtotal: group.subtotal,
        });
      }

      await applyReferralRewardsForPaidOrder(target.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("already marked as paid")) {
        continue;
      }
      throw error;
    }
  }
}

export async function handleLegacyOrderCheckout(
  session: Stripe.Checkout.Session,
) {
  const orderId = session.metadata?.orderId;
  const checkoutGroupId = session.metadata?.checkoutGroupId || null;
  const paymentIntentRaw = session.payment_intent;

  const paymentIntentId =
    typeof paymentIntentRaw === "string"
      ? paymentIntentRaw
      : (paymentIntentRaw?.id ?? null);

  if (!orderId || !paymentIntentId) {
    return new NextResponse("Invalid checkout metadata", { status: 400 });
  }

  await settleCreatedOrders({ orderId, checkoutGroupId, paymentIntentId });
  return new NextResponse(null, { status: 200 });
}

export async function handleOrderCheckout(session: Stripe.Checkout.Session) {
  const paymentIntentRaw = session.payment_intent;

  const paymentIntentId =
    typeof paymentIntentRaw === "string"
      ? paymentIntentRaw
      : (paymentIntentRaw?.id ?? null);

  const addressId = session.metadata?.addressId;
  const deliveryTypeRaw = session.metadata?.deliveryType;
  const couponIdRaw = session.metadata?.couponId;
  const idempotencyKey = session.metadata?.idempotencyKey;
  const userId = session.metadata?.userId;

  if (
    !paymentIntentId ||
    !addressId ||
    !deliveryTypeRaw ||
    !idempotencyKey ||
    !userId
  ) {
    return new NextResponse("Invalid checkout metadata", { status: 400 });
  }

  if (!isDeliveryType(deliveryTypeRaw)) {
    return new NextResponse("Invalid delivery type", { status: 400 });
  }

  const placeOrder = await placeOrderAction({
    addressId,
    paymentMethod: "CARD",
    deliveryType: deliveryTypeRaw,
    couponId: couponIdRaw ? couponIdRaw : null,
    idempotencyKey,
    __internalUserId: userId,
    __internalAuthToken: process.env.STRIPE_WEBHOOK_SECRET,
  });

  if ("error" in placeOrder) {
    console.error("Failed to create order from webhook:", placeOrder.error);
    return new NextResponse(placeOrder.error, { status: 400 });
  }

  if (!placeOrder.orderId) {
    return new NextResponse("Order not created from webhook checkout", {
      status: 400,
    });
  }

  await settleCreatedOrders({
    orderId: placeOrder.orderId,
    checkoutGroupId: placeOrder.checkoutGroupId,
    paymentIntentId,
  });

  return new NextResponse(null, { status: 200 });
}
