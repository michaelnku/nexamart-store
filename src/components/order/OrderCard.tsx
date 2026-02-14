"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Store, ChevronRight, Copy } from "lucide-react";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import { OrderDetailDTO } from "@/lib/types";
import { toast } from "sonner";

type Props = {
  order: OrderDetailDTO;
};

const OrderCard = ({ order }: Props) => {
  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-500",
    ACCEPTED: "bg-blue-500",
    SHIPPED: "bg-purple-500",
    DELIVERED: "bg-green-600",
    COMPLETED: "bg-green-700",
    CANCELLED: "bg-red-600",
    RETURN_REQUESTED: "bg-orange-500",
    RETURNED: "bg-red-500",
    REFUNDED: "bg-gray-600",
  };

  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/customer/order/track/tn/${order.trackingNumber}`
      : `/customer/order/track/tn/${order.trackingNumber}`;

  const copyTrackingLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success("Tracking number copied");
    } catch {
      toast.error("Failed to copy tracking number");
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Order Details
        </h1>

        <p className="text-gray-600 text-sm font-mono">Order ID: {order.id}</p>

        <p className="text-sm text-gray-600 mt-1 ">
          Tracking No:{" "}
          <span className="font-mono text-[var(--brand-blue)]">
            {order.trackingNumber}
          </span>
          <Button
            variant="ghost"
            onClick={copyTrackingLink}
            className="text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10 "
          >
            <Copy className="w-4 h-4" />
          </Button>
        </p>

        <Badge
          className={`${
            statusColor[order.status]
          } text-white text-sm px-3 py-1 rounded-full`}
        >
          {order.status.replaceAll("_", " ")}
        </Badge>
      </div>

      <section className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
        <div className="border rounded-xl p-6 bg-white dark:bg-background shadow-sm space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#3c9ee0]" /> Delivery Information
          </h2>

          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-semibold">Delivery Address: </span>
              {order.deliveryAddress}
            </p>

            {order.paymentMethod && (
              <p>
                <span className="font-semibold ">Payment Method:</span>{" "}
                {order.paymentMethod === "CARD"
                  ? "Card Payment"
                  : order.paymentMethod === "WALLET"
                    ? "Wallet"
                    : order.paymentMethod}
              </p>
            )}
            <p>
              <span className="font-semibold">Delivery Type: </span>
              {order.deliveryType.replaceAll("_", " ")}
            </p>
            <p>
              <span className="font-semibold">Shipping Fee: </span>
              {formatBaseUSD(order.shippingFee)}
            </p>
            <p>
              <span className="font-semibold">Order Date: </span>
              {new Date(order.createdAt).toLocaleDateString("en-US", {
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

        <div className="border rounded-xl p-6 bg-white dark:bg-background shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Store className="w-5 h-5 text-green-600" /> Customer Info
          </h2>

          <p className="font-medium text-base mt-1 dark:text-gray-400">
            {order.customer.name}
          </p>
          <p className="text-gray-600 text-sm">{order.customer.email}</p>
        </div>
      </section>

      <section className="space-y-8">
        {order.sellerGroups.map((group) => (
          <div
            key={group.id}
            className="border rounded-xl bg-white shadow-sm p-6 space-y-5"
          >
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
                      {formatBaseUSD(item.price)}
                      <span className="text-gray-500">× {item.quantity}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-right font-bold text-lg dark:text-gray-400">
              Subtotal: {formatBaseUSD(group.subtotal)}
            </p>
          </div>
        ))}
      </section>

      <div className="text-right text-2xl font-bold dark:text-gray-400">
        Total: {formatBaseUSD(order.totalAmount)}
      </div>

      <section className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="w-full">
          <Button className="w-full bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-semibold">
            Continue Shopping
          </Button>
        </Link>
      </section>
    </main>
  );
};

export default OrderCard;
