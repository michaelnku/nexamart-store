"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Copy,
} from "lucide-react";
import { formatBaseUSD } from "@/lib/formatBaseUSD";
import { OrderTrackDTO } from "@/lib/types";
import OrderTimeline from "./OrderTimeline";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  order: OrderTrackDTO;
};

export default function OrderTrackCard({ order }: Props) {
  const delivery = order.delivery;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    PROCESSING: "bg-blue-500",
    IN_TRANSIT: "bg-orange-500",
    DELIVERED: "bg-green-600",
    CANCELLED: "bg-red-600",
    RETURNED: "bg-red-500",
  };

  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/track/tn/${order.trackingNumber}`
      : `/track/tn/${order.trackingNumber}`;

  const copyTrackingLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success("Tracking number copied");
    } catch {
      toast.error("Failed to copy tracking number");
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-10">
      {/* ================= HEADER ================= */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-[var(--brand-blue)]" />
            Track Order
          </h1>

          <p className="text-gray-600 text-sm mt-1">
            Order ID:{" "}
            <span className="font-mono text-gray-800">{order.id}</span>
          </p>

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
        </div>

        <Badge
          className={`${statusColors[order.status]} px-3 py-1 text-xs font-semibold capitalize`}
        >
          {order.status.replaceAll("_", " ")}
        </Badge>
      </header>

      {/* QR CODE */}
      <div className="flex items-center justify-center">
        <div className="rounded-xl border bg-white p-4">
          <QRCodeCanvas
            value={trackingUrl}
            size={150}
            level="H"
            includeMargin
          />
          <p className="text-xs text-gray-500 text-center mt-2">
            Scan to track
          </p>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <section className="grid gap-5 lg:grid-cols-[2.2fr,1.3fr]">
        {/* PRODUCT */}
        <div className="border rounded-xl p-4 bg-white shadow-sm flex gap-4">
          <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100">
            <Image
              src={
                order.items[0].product.images[0]?.imageUrl ?? "/placeholder.png"
              }
              alt="Product"
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-2">
              {order.items[0].product.name}
            </p>

            <p className="text-sm text-gray-500">
              {order.items.length} item
              {order.items.length > 1 && "s"} •{" "}
              {formatBaseUSD(order.totalAmount)}
            </p>

            <p className="text-xs text-gray-500">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* DELIVERY INFO */}
        <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <MapPin className="w-4 h-4 text-[var(--brand-blue)]" />
            Delivery Address
          </div>

          <p className="text-sm">{order.deliveryAddress ?? "—"}</p>

          <div className="text-xs space-y-1 pt-2">
            <p>
              <strong>Payment:</strong> {order.paymentMethod ?? "—"}
            </p>

            <p>
              <strong>Delivery Type:</strong>{" "}
              {order.deliveryType.replace("_", " ")}
            </p>

            <p>
              <strong>Shipping Fee:</strong> {formatBaseUSD(order.shippingFee)}
            </p>
          </div>

          {delivery?.rider && (
            <div className="pt-3 border-t text-xs">
              <p className="font-semibold">Assigned Rider</p>
              <p>{delivery.rider.name}</p>
              <p className="text-gray-500">{delivery.rider.email}</p>
            </div>
          )}
        </div>
      </section>

      <OrderTimeline timeline={order.orderTimelines} order={order} />

      {/* ================= ACTIONS ================= */}
      <section className="flex flex-col sm:flex-row gap-3">
        <Link href={`/customer/order/${order.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View full order details
          </Button>
        </Link>

        <Link href="/" className="w-full">
          <Button className="w-full bg-[var(--brand-blue)] text-white">
            Continue shopping
          </Button>
        </Link>
      </section>
    </main>
  );
}
