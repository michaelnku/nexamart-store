import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { DeliveryType } from "@/generated/prisma/client";
import { placeOrderAction } from "@/actions/checkout/placeOrder";
import { stripe } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/config/appUrl";

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

    if (!placeOrder.orderId || !placeOrder.totalAmount || placeOrder.totalAmount <= 0) {
      return new NextResponse(
        "Order not properly initialized via place Order Action",
        {
          status: 400,
        },
      );
    }

    const baseUrl = getAppBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name:
                placeOrder.orders && placeOrder.orders.length > 1
                  ? `NexaMart Checkout (${placeOrder.orders.length} orders)`
                  : `NexaMart Order ${placeOrder.orderId.slice(-8)}`,
            },
            unit_amount: Math.round(placeOrder.totalAmount * 100),
          },
        },
      ],
      success_url: `${baseUrl}/customer/order/success/${placeOrder.orderId}`,
      cancel_url: `${baseUrl}/cart?canceled=1`,
      metadata: {
        orderId: placeOrder.orderId,
        checkoutGroupId: placeOrder.checkoutGroupId ?? "",
      },
    });

    return NextResponse.json({ url: session.url }, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return new NextResponse(message, { status: 500 });
  }
}
