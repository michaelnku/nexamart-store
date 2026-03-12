"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Truck, Store, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import DisputeEvidenceGallery from "@/components/disputes/DisputeEvidenceGallery";
import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import DisputeSummaryCard from "@/components/disputes/DisputeSummaryCard";
import DisputeTimeline from "@/components/disputes/DisputeTimeline";
import RaiseDisputeDialog from "@/components/disputes/RaiseDisputeDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import { buildDisputeTimeline, canCustomerRaiseDispute } from "@/lib/disputes/ui";
import { getOrderStatusLabel } from "@/lib/order/statusLabel";
import { OrderDetailDTO } from "@/lib/types";

type Props = {
  order: OrderDetailDTO;
};

const statusColor: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-500",
  PAID: "bg-emerald-500",
  ACCEPTED: "bg-blue-500",
  READY: "bg-emerald-600",
  IN_DELIVERY: "bg-indigo-500",
  DELIVERED: "bg-green-600",
  COMPLETED: "bg-green-700",
  CANCELLED: "bg-red-600",
  RETURN_REQUESTED: "bg-orange-500",
  RETURNED: "bg-red-500",
  REFUNDED: "bg-gray-600",
  DISPUTED: "bg-red-700",
};

const refundStatusTone: Record<string, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-700",
};

export default function OrderCard({ order }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canReview = order.status === "DELIVERED" || order.status === "COMPLETED";
  const canRaiseDispute = canCustomerRaiseDispute(order);

  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/customer/order/track/tn/${order.trackingNumber}`
      : `/customer/order/track/tn/${order.trackingNumber}`;

  const disputeTimeline = useMemo(
    () =>
      order.dispute ? buildDisputeTimeline(order.dispute, order.orderTimelines) : [],
    [order.dispute, order.orderTimelines],
  );

  const copyTrackingLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success("Tracking number copied");
    } catch {
      toast.error("Failed to copy tracking number");
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-6">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Order Details
        </h1>

        <p className="font-mono text-sm text-gray-600">Order ID: {order.id}</p>

        <p className="mt-1 text-sm text-gray-600">
          Tracking No:{" "}
          <span className="font-mono text-[var(--brand-blue)]">
            {order.trackingNumber}
          </span>
          <Button
            variant="ghost"
            onClick={copyTrackingLink}
            className="text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </p>

        <div className="flex items-center justify-center gap-2">
          <Badge
            className={`${
              statusColor[order.status] ?? "bg-gray-500"
            } rounded-full px-3 py-1 text-sm text-white`}
          >
            {getOrderStatusLabel(order.status)}
          </Badge>

          {order.dispute ? (
            <DisputeStatusBadge status={order.dispute.status} />
          ) : null}
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
        <div className="space-y-3 rounded-xl border bg-white p-6 shadow-sm dark:bg-background">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Truck className="h-5 w-5 text-[#3c9ee0]" /> Delivery Information
          </h2>

          <div className="space-y-1 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Delivery Address: </span>
              {order.deliveryAddress}
            </p>

            {order.paymentMethod ? (
              <p>
                <span className="font-semibold">Payment Method:</span>{" "}
                {order.paymentMethod === "CARD"
                  ? "Card Payment"
                  : order.paymentMethod === "WALLET"
                    ? "Wallet"
                    : order.paymentMethod}
              </p>
            ) : null}

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

          {order.status !== "CANCELLED" ? (
            <Link href={`/customer/order/track/${order.id}`}>
              <Button className="mt-4 w-full bg-[#3c9ee0] font-semibold hover:bg-[#318bc4]">
                Track Delivery <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          ) : null}
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-background">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Store className="h-5 w-5 text-green-600" /> Customer Info
          </h2>

          <p className="mt-1 text-base font-medium dark:text-gray-400">
            {order.customer.name}
          </p>
          <p className="text-sm text-gray-600">{order.customer.email}</p>
        </div>
      </section>

      {order.dispute ? (
        <section id="dispute-summary" className="space-y-6">
          <DisputeSummaryCard dispute={order.dispute} />

          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Dispute Timeline</h2>
              <DisputeTimeline items={disputeTimeline} />
            </div>

            <DisputeEvidenceGallery evidence={order.dispute.evidence} />
          </div>
        </section>
      ) : null}

      <section className="space-y-8">
        {order.sellerGroups.map((group) => (
          <div
            key={group.id}
            className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="flex min-w-0 items-center gap-2 text-lg font-semibold">
                  <Store className="h-5 w-5 shrink-0 text-green-600" />
                  <span className="truncate">{group.store.name}</span>
                </h3>

                {group.store.slug ? (
                  <Link
                    href={`/store/${group.store.slug}`}
                    className="text-sm font-medium text-[#3c9ee0] hover:underline"
                  >
                    Visit Store →
                  </Link>
                ) : null}
              </div>

              <Badge className="self-start bg-gray-700 text-white sm:self-auto">
                {group.status.replaceAll("_", " ")}
              </Badge>
            </div>

            <div className="space-y-5">
              {group.cancellation ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold">
                      Cancelled by {group.cancellation.cancelledBy.toLowerCase()}
                    </p>
                    <p className="text-xs text-red-800/80">
                      {new Date(group.cancellation.cancelledAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-2">
                    Reason:{" "}
                    <span className="font-medium">
                      {group.cancellation.reasonLabel}
                    </span>
                  </p>
                  {group.cancellation.note ? (
                    <p className="mt-1 text-red-800/90">
                      Note: {group.cancellation.note}
                    </p>
                  ) : null}
                  {(group.cancellation.refundStatus ||
                    group.cancellation.refundMessage) && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      {group.cancellation.refundStatus ? (
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                            refundStatusTone[group.cancellation.refundStatus] ??
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          Refund {group.cancellation.refundStatus.toLowerCase()}
                        </span>
                      ) : null}
                      {group.cancellation.refundMessage ? (
                        <p className="text-sm text-red-800/90">
                          {group.cancellation.refundMessage}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-5 border-b pb-4 last:border-0"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={item.product.images[0]?.imageUrl ?? "/placeholder.png"}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2 text-sm font-medium">
                      {item.product.name}
                    </p>

                    {item.variant ? (
                      <p className="text-xs text-gray-500">
                        {item.variant.color} {item.variant.size}
                      </p>
                    ) : null}

                    <p className="font-semibold text-[#3c9ee0]">
                      {formatBaseUSD(item.price)}
                      <span className="text-gray-500"> × {item.quantity}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-right text-lg font-bold dark:text-gray-400">
              Subtotal: {formatBaseUSD(group.subtotal)}
            </p>
          </div>
        ))}
      </section>

      <div className="text-right text-2xl font-bold dark:text-gray-400">
        Total: {formatBaseUSD(order.totalAmount)}
      </div>

      <section className="flex flex-col gap-4 sm:flex-row">
        {canReview ? (
          <Link href={`/customer/order/${order.id}#review`} className="w-full">
            <Button variant="outline" className="w-full font-semibold">
              Write Review
            </Button>
          </Link>
        ) : null}

        {canRaiseDispute ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full font-semibold"
            onClick={() => setDialogOpen(true)}
          >
            Raise Dispute
          </Button>
        ) : null}

        {order.dispute ? (
          <Button
            type="button"
            variant="outline"
            className="w-full font-semibold"
            onClick={() =>
              document
                .getElementById("dispute-summary")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            View Dispute
          </Button>
        ) : null}

        <Link href="/" className="w-full">
          <Button className="w-full bg-[#3c9ee0] font-semibold text-white hover:bg-[#318bc4]">
            Continue Shopping
          </Button>
        </Link>
      </section>

      <RaiseDisputeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orderId={order.id}
        isFoodOrder={Boolean(order.isFoodOrder)}
      />
    </main>
  );
}
