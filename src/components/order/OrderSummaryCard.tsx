"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import { ClearCartOnSuccess } from "@/app/(site)/customer/order/success/[orderId]/ClearCartOnSuccess";
import { OrderSummaryDTO } from "@/lib/types";
import { toast } from "sonner";

type Props = {
  order: OrderSummaryDTO;
};

const OrderSummaryCard = ({ order }: Props) => {
  const trackingNumber = order.trackingNumber ?? "NEX-ORD-XXXXX";
  const deliveryTypeLabel = order.deliveryType
    ? order.deliveryType.replaceAll("_", " ")
    : "N/A";

  // ETA window between 4 and 10 days from order creation
  const orderCreatedAt = new Date(order.createdAt);
  const min = new Date(orderCreatedAt.getTime() + 4 * 24 * 60 * 60 * 1000);
  const max = new Date(orderCreatedAt.getTime() + 10 * 24 * 60 * 60 * 1000);
  const eta = `${min.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${max.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/customer/order/track/tn/${trackingNumber}`
      : `/customer/order/track/tn/${trackingNumber}`;

  const copyTrackingLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success("Tracking number copied");
    } catch {
      toast.error("Failed to copy tracking number");
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-16 space-y-10">
      <ClearCartOnSuccess />

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

        <div className="mt-3 flex flex-col items-center gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Tracking Number
          </p>

          <span className="inline-flex gap-2 items-center">
            <p className="font-mono text-sm font-semibold text-[var(--brand-blue)]">
              {trackingNumber}
            </p>
            <Button
              variant="ghost"
              onClick={copyTrackingLink}
              className="text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10 "
            >
              <Copy className="w-4 h-4" />
            </Button>
          </span>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-8">
        <p className="text-lg font-semibold">
          Estimated Arrival:{" "}
          <span className="text-[#3c9ee0] font-bold">{eta}</span>
        </p>

        <p className="text-sm text-gray-700">
          Delivery Method:{" "}
          <span className="font-semibold text-[#3c9ee0]">
            {deliveryTypeLabel}
          </span>
        </p>

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
                  {formatBaseUSD(item.price)} {""}
                  <span className="text-gray-600 font-normal">
                    x {item.quantity}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-right text-xl font-bold text-[#3c9ee0]">
          Total Paid: {formatBaseUSD(order.totalAmount)}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={`/customer/order/track/tn/${trackingNumber}`}
            className="w-full"
          >
            <Button
              size="lg"
              className="w-full bg-[#3c9ee0] hover:bg-[#318bc4] text-white font-semibold rounded-lg shadow"
            >
              Track order
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
};

export default OrderSummaryCard;
