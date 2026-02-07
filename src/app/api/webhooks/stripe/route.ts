import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoAssignRider } from "@/lib/logistics";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = Stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("❌ Webhook signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  console.log("🔥 Webhook received:", event.type);

  const session = event.data.object as Stripe.Checkout.Session;

  const address = session?.customer_details?.address;
  const addressComponents = [
    address?.line1,
    address?.line2,
    address?.city,
    address?.state,
    address?.postal_code,
    address?.country,
  ];
  const addressString = addressComponents.filter(Boolean).join(", ");

  if (event.type === "checkout.session.completed") {
    const orderId = session?.metadata?.orderId;

    if (!orderId) {
      console.error("Missing orderId in Stripe metadata");
      return new NextResponse("Invalid orderId", { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        deliveryAddress: addressString,
        phone: session?.customer_details?.phone ?? null,
        status: "PROCESSING",
      },
      include: {
        items: { include: { product: { include: { store: true } } } },
      },
    });

    const productIds = order.items.map((i) => i.productId);
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { isPublished: true },
    });

    // ============================
    // NOTIFY CUSTOMER OF PAYMENT
    // ============================
    await pusherServer.trigger(`user-${order.userId}`, "payment-success", {
      orderId,
      message: "Payment received! Your order is now processing.",
    });

    // ============================
    // BUILD SELLER GROUPS
    // ============================
    const grouped = new Map<
      string,
      { sellerId: string; storeId: string; items: typeof order.items }
    >();

    let isFoodOrder = false;

    for (const item of order.items) {
      const store = item.product.store;

      if (!grouped.has(store.id)) {
        grouped.set(store.id, {
          sellerId: store.userId,
          storeId: store.id,
          items: [],
        });
      }

      grouped.get(store.id)!.items.push(item);

      if (store.type === "FOOD") {
        isFoodOrder = true;
      }
    }

    // Save food flag
    await prisma.order.update({
      where: { id: orderId },
      data: { isFoodOrder },
    });

    // Create seller groups + notify sellers
    for (const [, group] of grouped.entries()) {
      const subtotal = group.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      const sg = await prisma.orderSellerGroup.create({
        data: {
          orderId,
          storeId: group.storeId,
          sellerId: group.sellerId,
          subtotal,
          shippingFee: 0,
        },
      });

      await prisma.orderItem.updateMany({
        where: { id: { in: group.items.map((i) => i.id) } },
        data: { sellerGroupId: sg.id },
      });

      // Notify each seller
      await pusherServer.trigger(`seller-${group.sellerId}`, "new-order", {
        orderId,
        storeId: group.storeId,
        subtotal,
      });
    }

    // Assign rider after all seller groups are ready
    await autoAssignRider(orderId);
  }

  return new NextResponse(null, { status: 200 });
}
