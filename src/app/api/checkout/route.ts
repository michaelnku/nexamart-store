import Stripe from "stripe";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CheckoutCartItem, CheckoutPayload } from "@/lib/types";

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
      distanceInMiles,
      deliveryAddress,
    } = body;

    if (!cartItems || cartItems.length === 0) {
      return new NextResponse("Cart is empty", { status: 400 });
    }

    // Fetch all products + variants used in the cart
    const products = await prisma.product.findMany({
      where: {
        id: { in: cartItems.map((i: CheckoutCartItem) => i.productId) },
      },
      include: { variants: true, store: true },
    });

    // Build line items + compute total
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

    // Calculate shipping
    const rate = 700; // same logic used in your UI
    const shippingFee = Math.round((distanceInMiles ?? 0) * rate);

    const totalAmount = subtotal + shippingFee;

    // Create order with items but do NOT assign sellerGroups yet
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        shippingFee,
        deliveryType,
        deliveryAddress,
        distanceInMiles,
        isPaid: false,
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

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_STORE_URL}/customer/order/success/${order.id}`,
      cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
      metadata: { orderId: order.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error.message, { status: 500 });
  }
}
