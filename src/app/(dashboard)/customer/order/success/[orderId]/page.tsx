import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrentUserId } from "@/lib/currentUser";
import { ClearCartOnSuccess } from "./ClearCartOnSuccess";

const currencySymbol = (currency: string | null | undefined) => {
  const map: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return currency && map[currency] ? map[currency] : "";
};

export default async function OrderSuccessPage(props: {
  params: { orderId?: string };
}) {
  const { orderId } = await props.params;
  const userId = await CurrentUserId();

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
    },
  });

  if (!order)
    return (
      <p className="text-center text-red-500 py-40 min-h-screen">
        Order not found.
      </p>
    );

  if (order.userId !== userId)
    return (
      <p className="text-center text-red-500 py-40 min-h-screen">
        Unauthorized access.
      </p>
    );

  /* Currency from product */
  const currency = order.items[0]?.product.currency ?? "USD";
  const symbol = currencySymbol(currency);

  /* ETA between 4 – 7 days */
  const min = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const max = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const eta = `${min.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${max.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

  return (
    <main className="max-w-4xl mx-auto py-16 space-y-10">
      <ClearCartOnSuccess />
      {/* ---------------- SUCCESS BANNER ---------------- */}
      <div className="bg-[#3c9ee0]/10 border border-[#3c9ee0]/30 py-8 rounded-xl shadow-sm text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-[#3c9ee0] mx-auto" />

        <h1 className="text-3xl font-bold text-[#318bc4]">
          Order placed successfully!
        </h1>

        <p className="text-gray-700">
          Thank you for shopping with{" "}
          <span className="font-semibold text-[#3c9ee0]">NexaMart</span>. Your
          order is now being processed.
        </p>

        <p className="text-gray-800 font-medium">
          <span className="font-semibold text-[#3c9ee0]">Order ID:</span>{" "}
          {order.id}
        </p>
      </div>

      {/* ---------------- ORDER SUMMARY CARD ---------------- */}
      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-8">
        {/* ETA */}
        <p className="text-lg font-semibold">
          Estimated Arrival:{" "}
          <span className="text-[#3c9ee0] font-bold">{eta}</span>
        </p>

        <p className="text-sm text-gray-700">
          Delivery Method:{" "}
          <span className="font-semibold text-[#3c9ee0]">
            {order.deliveryType.replace("_", " ")}
          </span>
        </p>

        {/* ITEMS */}
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 pb-4 border-b last:border-none overflow-hidden"
            >
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src={item.product.images[0]?.imageUrl ?? "/placeholder.png"}
                  alt={item.product.name}
                  fill
                  className="rounded-md object-cover"
                />
              </div>

              <div className="flex flex-col justify-between w-full min-w-0">
                <p className="font-medium text-[15px] line-clamp-2 leading-snug">
                  {item.product.name}
                </p>

                {item.variant && (
                  <p className="text-sm text-gray-500 truncate">
                    {item.variant.color} {item.variant.size}
                  </p>
                )}

                <p className="font-semibold mt-1 text-lg text-[#3c9ee0]">
                  {symbol}
                  {item.price.toLocaleString()}{" "}
                  <span className="text-gray-600 font-normal">
                    × {item.quantity}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div className="text-right text-xl font-bold text-[#3c9ee0]">
          Total Paid: {symbol}
          {order.totalAmount.toLocaleString()}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href={`/customer/order/track/${order.id}`} className="w-full">
            <Button
              size="lg"
              className="w-full bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-semibold rounded-lg shadow"
            >
              Track your package
            </Button>
          </Link>

          <Link href={`/customer/order/${order.id}`} className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-[#3c9ee0] text-[#3c9ee0] hover:bg-[#3c9ee0]/10 font-semibold rounded-lg"
            >
              View order details
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button
              variant="secondary"
              size="lg"
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold rounded-lg"
            >
              Continue shopping
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
