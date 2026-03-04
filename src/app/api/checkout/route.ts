import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { DeliveryType } from "@/generated/prisma/client";
import { CurrentUserId } from "@/lib/currentUser";
import { getCheckoutPreviewAction } from "@/actions/checkout/getCheckoutPreview";
import { stripe } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/config/appUrl";

const corsHeaders = {
  "Access-Control-Allow-Origin": getAppBaseUrl(),
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
    let body: CheckoutRequestBody;
    try {
      body = await req.json();
    } catch {
      return new NextResponse("Invalid JSON body", { status: 400 });
    }

    if (!body.addressId) {
      return new NextResponse("Address is required", { status: 400 });
    }

    if (!body.deliveryType) {
      return new NextResponse("Delivery type is required", { status: 400 });
    }

    const idempotencyKey = body.idempotencyKey ?? randomUUID();
    const userId = await CurrentUserId();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const preview = await getCheckoutPreviewAction({
      addressId: body.addressId,
      deliveryType: body.deliveryType,
      couponId: body.couponId ?? null,
    });

    if ("error" in preview) {
      const status = preview.error === "Unauthorized" ? 401 : 400;
      return new NextResponse(preview.error, { status });
    }

    if (!preview.totalUSD || preview.totalUSD <= 0) {
      return new NextResponse("Invalid checkout total amount", { status: 400 });
    }

    const baseUrl = getAppBaseUrl();

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              product_data: {
                name: "NexaMart Checkout",
              },
              unit_amount: Math.round(preview.totalUSD * 100),
            },
          },
        ],
        success_url: `${baseUrl}/customer/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cart?canceled=1`,
        metadata: {
          type: "ORDER_CHECKOUT",
          addressId: body.addressId,
          deliveryType: body.deliveryType,
          couponId: body.couponId ?? "",
          idempotencyKey,
          userId,
        },
      },
      {
        idempotencyKey,
      },
    );

    if (!session.url) {
      return new NextResponse("Failed to create checkout session", {
        status: 500,
      });
    }

    return NextResponse.json({ url: session.url }, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return new NextResponse(message, { status: 500 });
  }
}
