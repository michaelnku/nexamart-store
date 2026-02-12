import Stripe from "stripe";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CheckoutCartItem, CheckoutPayload } from "@/lib/types";
import { resolveCouponForOrder } from "@/lib/coupons/resolveCouponForOrder";
import { generateTrackingNumber } from "@/components/helper/generateTrackingNumber";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutPayload;

    const {
      cartItems,
      deliveryType,
      userId,
      addressId,
      distanceInMiles,
      couponId,
    } = body;

    if (!cartItems || cartItems.length === 0) {
      return new NextResponse("Cart is empty", { status: 400 });
    }
    if (!addressId) {
      return new NextResponse("Address is required", { status: 400 });
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
      select: {
        fullName: true,
        phone: true,
        street: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
      },
    });

    if (!address) {
      return new NextResponse("Invalid address", { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: cartItems.map((i: CheckoutCartItem) => i.productId) },
      },
      include: { variants: true, store: true },
    });

    const storeTypes = new Set(products.map((p) => p.store.type));
    const isFoodOrder = storeTypes.has("FOOD");
    if (isFoodOrder && storeTypes.size > 1) {
      return new NextResponse(
        "Food orders cannot be mixed with non-food items",
        { status: 400 },
      );
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    let subtotal = 0;

    for (const item of cartItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      const variant = product.variants.find((v) => v.id === item.variantId);

      const price = variant?.priceUSD ?? product.basePriceUSD;

      subtotal += price * item.quantity;

      line_items.push({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          product_data: { name: product.name },
          unit_amount: Math.round(price * 100),
        },
      });
    }

    const miles = distanceInMiles ?? 0;
    const shippingByStore = new Map<string, number>();
    for (const product of products) {
      shippingByStore.set(
        product.storeId,
        (product.store.shippingRatePerMile ?? 0) * miles,
      );
    }
    const shippingFee = Array.from(shippingByStore.values()).reduce(
      (sum, fee) => sum + fee,
      0,
    );

    if (shippingFee > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: Math.round(shippingFee * 100),
        },
      });
    }

    const couponResult = await resolveCouponForOrder({
      userId,
      couponId,
      subtotalUSD: subtotal,
      shippingUSD: shippingFee,
    });

    if ("error" in couponResult) {
      return new NextResponse(couponResult.error, { status: 400 });
    }

    const discountAmount = couponResult.discountAmount ?? 0;
    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);
    const trackingNumber = generateTrackingNumber();

    // Create order with items but do NOT assign sellerGroups yet
    const order = await prisma.order.create({
      data: {
        userId,
        trackingNumber,
        totalAmount,
        shippingFee,
        deliveryType,
        distanceInMiles: miles,
        paymentMethod: "CARD",
        deliveryFullName: address.fullName,
        deliveryPhone: address.phone,
        deliveryStreet: address.street,
        deliveryCity: address.city,
        deliveryState: address.state ?? "",
        deliveryCountry: address.country,
        deliveryPostal: address.postalCode ?? "",
        isPaid: false,
        isFoodOrder,
        couponId: couponResult.coupon?.id ?? null,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        items: {
          create: cartItems.map((item: CheckoutCartItem) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
              throw new Error("Invalid product");
            }

            const variant = product.variants.find(
              (v) => v.id === item.variantId,
            );

            const price = variant?.priceUSD ?? product.basePriceUSD;

            if (price == null) {
              throw new Error("Invalid product price");
            }

            return {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price,
            };
          }),
        },
      },
    });

    if (couponResult.coupon?.id) {
      await prisma.couponUsage.create({
        data: {
          couponId: couponResult.coupon.id,
          userId,
          orderId: order.id,
        },
      });

      await prisma.coupon.update({
        where: { id: couponResult.coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Create Stripe coupon (if discount applies)
    let stripeCouponId: string | undefined;
    if (discountAmount > 0 && couponResult.coupon?.id) {
      const isPercent = couponResult.coupon.type === "PERCENTAGE";
      const clampedPercent = Math.min(
        Math.max(couponResult.coupon.value, 1),
        100,
      );

      const coupon = await stripe.coupons.create({
        duration: "once",
        ...(isPercent
          ? { percent_off: clampedPercent }
          : {
              amount_off: Math.round(discountAmount * 100),
              currency: "usd",
            }),
        name: `coupon-${couponResult.coupon.id}`,
      });
      stripeCouponId = coupon.id;
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_STORE_URL}/customer/order/success/${order.id}`,
      cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
      metadata: { orderId: order.id },
      ...(stripeCouponId
        ? { discounts: [{ coupon: stripeCouponId }] }
        : undefined),
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error.message, { status: 500 });
  }
}
