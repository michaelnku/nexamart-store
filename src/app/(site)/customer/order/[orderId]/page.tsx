import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Store, ChevronRight } from "lucide-react";

const currencySymbol = (code: string | null) => {
  if (!code) return "";
  return { NGN: "₦", USD: "$", EUR: "€", GBP: "£" }[code] ?? code;
};

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
      delivery: true,
      customer: true,
      sellerGroups: {
        include: {
          store: true,
          seller: true,
          items: {
            include: {
              product: { include: { images: true } },
              variant: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return (
      <p className="text-center text-red-500 py-40 min-h-screen">
        Order not found
      </p>
    );
  }

  const symbol = currencySymbol(order.items[0]?.product?.currency ?? "NGN");

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-500",
    PROCESSING: "bg-blue-500",
    SHIPPED: "bg-purple-500",
    IN_TRANSIT: "bg-orange-500",
    DELIVERED: "bg-green-600",
    CANCELLED: "bg-red-600",
    RETURNED: "bg-red-500",
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      {/* HEADER */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Order Details
        </h1>

        <p className="text-gray-600 text-sm font-mono">Order ID: {order.id}</p>

        <Badge
          className={`${
            statusColor[order.status]
          } text-white text-sm px-3 py-1 rounded-full`}
        >
          {order.status.replaceAll("_", " ")}
        </Badge>
      </div>

      {/* DELIVERY INFO + CUSTOMER */}
      <section className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
        <div className="border rounded-xl p-6 bg-white shadow-sm space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#3c9ee0]" /> Delivery Information
          </h2>

          <div className="text-sm text-gray-700 space-y-1">
            <p>{order.deliveryAddress}</p>
            <p>
              <span className="font-semibold">Payment Method:</span>{" "}
              {order.paymentMethod?.replaceAll("_", " ") ?? "-"}
            </p>
            <p>
              <span className="font-semibold">Delivery Type:</span>{" "}
              {order.deliveryType.replaceAll("_", " ")}
            </p>
            <p>
              <span className="font-semibold">Shipping Fee:</span> {symbol}
              {order.shippingFee.toLocaleString()}
            </p>
            <p>
              <span className="font-semibold">Order Date:</span>{" "}
              {new Date(order.createdAt).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {order.status !== "CANCELLED" && (
            <Link href={`/customer/order/track/${order.id}`}>
              <Button className="w-full mt-4 bg-[#3c9ee0] hover:bg-[#318bc4] font-semibold">
                Track Delivery <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        {/* CUSTOMER INFO */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Store className="w-5 h-5 text-green-600" /> Customer
          </h2>

          <p className="font-medium text-base mt-1">{order.customer.name}</p>
          <p className="text-gray-600 text-sm">{order.customer.email}</p>
        </div>
      </section>

      {/* 🛒 MULTI-SELLER GROUPS */}
      <section className="space-y-8">
        {order.sellerGroups.map((group) => (
          <div
            key={group.id}
            className="border rounded-xl bg-white shadow-sm p-6 space-y-5"
          >
            {/* SELLER HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Store className="w-5 h-5 text-green-600" />
                  {group.store.name}
                </h3>

                {group.store.slug && (
                  <Link
                    href={`/store/${group.store.slug}`}
                    className="text-[#3c9ee0] hover:underline text-sm font-medium"
                  >
                    Visit Store →
                  </Link>
                )}
              </div>

              <Badge className="bg-gray-700 text-white">
                {group.status.replaceAll("_", " ")}
              </Badge>
            </div>

            {/* SELLER ITEMS */}
            <div className="space-y-5">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-5 border-b pb-4 last:border-0"
                >
                  <div className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100">
                    <Image
                      src={
                        item.product.images[0]?.imageUrl ?? "/placeholder.png"
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{item.product.name}</p>

                    {item.variant && (
                      <p className="text-xs text-gray-500">
                        {item.variant.color} {item.variant.size}
                      </p>
                    )}

                    <p className="text-[#3c9ee0] font-semibold">
                      {symbol}
                      {item.price.toLocaleString()}{" "}
                      <span className="text-gray-500">× {item.quantity}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* SUBTOTAL */}
            <p className="text-right font-bold text-lg">
              Subtotal: {symbol}
              {group.subtotal.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      {/* TOTAL */}
      <div className="text-right text-2xl font-bold">
        Total: {symbol}
        {order.totalAmount.toLocaleString()}
      </div>

      {/* ACTIONS */}
      <section className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="w-full">
          <Button className="w-full bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-semibold">
            Continue Shopping
          </Button>
        </Link>
      </section>
    </main>
  );
}
