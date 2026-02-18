import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { DeliveryType } from "@/generated/prisma/client";
import { placeOrderAction } from "@/actions/checkout/placeOrder";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type CheckoutRequestBody = {
  addressId?: string;
  deliveryType?: DeliveryType;
  couponId?: string | null;
  idempotencyKey?: string;
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;

    if (!body.addressId) {
      return new NextResponse("Address is required", { status: 400 });
    }

    if (!body.deliveryType) {
      return new NextResponse("Delivery type is required", { status: 400 });
    }

    const idempotencyKey = body.idempotencyKey ?? randomUUID();

    // Pricing engine authority:
    // placeOrderAction is the only source of truth for shipping, subtotal, discount, and totals.
    const placeOrder = await placeOrderAction({
      addressId: body.addressId,
      paymentMethod: "CARD",
      deliveryType: body.deliveryType,
      couponId: body.couponId ?? null,
      idempotencyKey,
    });

    if ("error" in placeOrder) {
      const status = placeOrder.error === "Unauthorized" ? 401 : 400;
      return new NextResponse(placeOrder.error, { status });
    }

    const order = await prisma.order.findUnique({
      where: { id: placeOrder.orderId },
      select: {
        id: true,
        totalAmount: true,
        shippingFee: true,
        sellerGroups: {
          select: { id: true },
        },
      },
    });

    if (
      !order ||
      order.shippingFee == null ||
      order.totalAmount <= 0 ||
      order.sellerGroups.length === 0
    ) {
      return new NextResponse("Order not properly initialized via placeOrderAction", {
        status: 400,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: `NexaMart Order ${order.id.slice(-8)}`,
            },
            unit_amount: Math.round(order.totalAmount * 100),
          },
        },
      ],
      success_url: `${process.env.FRONTEND_STORE_URL}/customer/order/success/${order.id}`,
      cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
      metadata: { orderId: order.id },
    });

    return NextResponse.json({ url: session.url }, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return new NextResponse(message, { status: 500 });
  }
}
