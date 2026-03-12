"use client";

import Link from "next/link";
import Image from "next/image";

import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import { OrderHistoryDTO } from "@/lib/types";
import { getOrderStatusLabel } from "@/lib/order/statusLabel";

type Props = {
  orders: OrderHistoryDTO;
};

export default function OrderHistoryCard({ orders }: Props) {
  const formatOrderDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold">Your Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => {
          if (!order.items.length) {
            return null;
          }

          const firstItem = order.items[0];
          const image = firstItem?.product.images?.[0]?.imageUrl || "/placeholder.png";

          return (
            <div
              key={order.id}
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow dark:bg-neutral-900"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">
                    ORDER PLACED:
                    <span className="font-medium text-gray-900 dark:text-gray-400">
                      {" "}
                      {formatOrderDate(order.createdAt)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    TOTAL:
                    <span className="font-medium text-gray-900 dark:text-gray-400">
                      {" "}
                      {formatBaseUSD(order.totalAmount)}
                    </span>
                  </p>
                  {order.isFoodOrder && order.prepTimeMinutes ? (
                    <p className="text-sm text-gray-500">
                      PREPARATION TIME:
                      <span className="font-medium text-gray-900 dark:text-gray-400">
                        {" "}
                        {order.prepTimeMinutes} min
                      </span>
                    </p>
                  ) : null}
                  <p className="text-sm text-gray-500">
                    ORDER ID:
                    <span className="text-[13px] font-mono">
                      {" "}
                      {order.id.slice(0, 12)}...
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                      order.status === "DELIVERED"
                        ? "bg-green-600"
                        : order.status === "COMPLETED"
                          ? "bg-green-700"
                          : order.status === "READY"
                            ? "bg-emerald-600"
                            : order.status === "IN_DELIVERY"
                              ? "bg-indigo-600"
                              : order.status === "PAID"
                                ? "bg-purple-600"
                                : order.status === "ACCEPTED"
                                  ? "bg-blue-600"
                                  : order.status === "PENDING_PAYMENT"
                                    ? "bg-yellow-600"
                                    : order.status === "CANCELLED"
                                      ? "bg-red-600"
                                      : order.status === "DISPUTED"
                                        ? "bg-red-700"
                                        : "bg-gray-500"
                    }`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </Badge>

                  {order.dispute ? (
                    <DisputeStatusBadge status={order.dispute.status} />
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex items-start gap-5">
                <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-gray-50 dark:bg-neutral-900">
                  <Image
                    src={image}
                    alt={firstItem.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="mb-1 line-clamp-2 text-[15px] font-medium leading-snug dark:text-gray-400"
                    title={firstItem.product.name}
                  >
                    {firstItem.product.name}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {order.items.length > 1
                      ? `+ ${order.items.length - 1} more item(s)`
                      : `${firstItem.quantity} item`}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/customer/order/${order.id}`}>
                  <Button variant="secondary" className="rounded-md">
                    View Order Details
                  </Button>
                </Link>

                {order.status !== "DELIVERED" &&
                order.status !== "COMPLETED" &&
                order.status !== "CANCELLED" ? (
                  <Link href={`/customer/order/track/tn/${order.trackingNumber}`}>
                    <Button className="rounded-md bg-blue-600 hover:bg-blue-700">
                      Track Package
                    </Button>
                  </Link>
                ) : null}

                {order.dispute ? (
                  <Link href={`/customer/order/${order.id}#dispute-summary`}>
                    <Button variant="outline" className="rounded-md">
                      View Dispute
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
