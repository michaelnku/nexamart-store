import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Store, ChevronRight } from "lucide-react";

/* Currency symbol map */
const currencySymbol = (code: string | null) => {
  if (!code) return "";
  const map: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return map[code] ?? code;
};

export default async function OrderDetailsPage(props: {
  params: { orderId: string };
}) {
  const { orderId } = await props.params;

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
      seller: { include: { store: true } },
      customer: true,
    },
  });

  if (!order) {
    return (
      <p className="text-center text-red-500 py-40 min-h-screen">
        Order not found
      </p>
    );
  }

  const symbol = currencySymbol(order.items[0]?.product.currency ?? "NGN");

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
          } text-white text-sm px-3 py-1 rounded-full capitalize`}
        >
          {order.status.replaceAll("_", " ")}
        </Badge>
      </div>

      {/* DELIVERY & SELLER INFO */}
      <section className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
        {/* Delivery Information */}
        <div className="border rounded-xl p-6 space-y-5 bg-white shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#3c9ee0]" />
            Delivery Information
          </h2>

          <div className="text-sm text-gray-700 space-y-2">
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

        {/* Seller */}
        <div className="border rounded-xl p-6 space-y-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Store className="w-5 h-5 text-green-600" /> Sold by
          </h2>

          <div className="space-y-1 text-sm text-gray-700">
            <p className="font-semibold text-base">
              {order.seller.store?.name ?? "Seller"}
            </p>

            {order.seller.store?.slug && (
              <Link
                href={`/store/${order.seller.store.slug}`}
                className="text-[#3c9ee0] hover:underline text-sm font-medium"
              >
                Visit Store →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ORDER ITEMS */}
      <section className="border rounded-xl p-6 bg-white shadow-sm space-y-6">
        <h2 className="text-lg font-semibold">Items in your order</h2>

        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap gap-5 border-b pb-5 last:border-0"
          >
            {/* PRODUCT IMAGE */}
            <div className="relative w-28 h-28 rounded-md overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={item.product.images[0]?.imageUrl ?? "/placeholder.png"}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>

            {/* PRODUCT DETAILS */}
            <div className="flex-1 space-y-1 min-w-[260px]">
              <p className="font-medium text-[15px] line-clamp-2">
                {item.product.name}
              </p>

              {item.variant && (
                <p className="text-sm text-gray-500">
                  {item.variant.color} {item.variant.size}
                </p>
              )}

              <p className="font-semibold text-[#3c9ee0] mt-1 text-[15px]">
                {symbol}
                {item.price.toLocaleString()}{" "}
                <span className="text-gray-600 font-normal">
                  × {item.quantity}
                </span>
              </p>
            </div>
          </div>
        ))}

        {/* TOTAL */}
        <div className="pt-3 text-right text-xl font-bold">
          Total: {symbol}
          {order.totalAmount.toLocaleString()}
        </div>
      </section>

      {/* ACTIONS */}
      <section className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="w-full">
          <Button className="w-full bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-semibold">
            Continue Shopping
          </Button>
        </Link>

        {order.seller.store?.slug && (
          <Link href={`/store/${order.seller.store.slug}`} className="w-full">
            <Button
              variant="outline"
              className="w-full border-[#3c9ee0] text-[#3c9ee0] hover:bg-[#3c9ee0]/10 font-semibold"
            >
              Contact Seller
            </Button>
          </Link>
        )}
      </section>
    </main>
  );
}
