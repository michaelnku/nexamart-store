"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderTrackDTO } from "@/lib/types";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";

type Props = {
  orders: OrderTrackDTO[];
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500",
  PROCESSING: "bg-blue-500",
  IN_TRANSIT: "bg-orange-500",
};

export default function OrderTrackGrid({ orders }: Props) {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Active Orders</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => {
          const firstItem = order.items[0];
          const image =
            firstItem.product.images[0]?.imageUrl ?? "/placeholder.png";

          return (
            <div
              key={order.id}
              className="border rounded-xl bg-white dark:bg-background shadow-sm p-4 flex flex-col gap-4"
            >
              {/* STATUS */}
              <Badge
                className={`${statusColors[order.status]} self-start text-xs capitalize`}
              >
                {order.status.replaceAll("_", " ")}
              </Badge>

              {/* PRODUCT */}
              <div className="flex gap-3 items-start">
                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                  <Image
                    src={image}
                    alt={firstItem.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 dark:text-gray-400">
                  <p className="font-medium text-sm line-clamp-2">
                    {firstItem.product.name}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {order.items.length > 1
                      ? `+ ${order.items.length - 1} more item(s)`
                      : `${firstItem.quantity} item`}
                  </p>
                </div>
              </div>

              {/* META */}
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Total:</strong> {formatBaseUSD(order.totalAmount)}
                </p>
                <p>
                  <strong>Tracking:</strong>{" "}
                  <span className="font-mono  text-[var(--brand-blue)]">
                    {order.trackingNumber}
                  </span>
                </p>
              </div>

              {/* ACTION */}
              <Link
                href={`/customer/order/track/tn/${order.trackingNumber}`}
                className="mt-auto"
              >
                <Button className="w-full bg-[var(--brand-blue)] text-white">
                  Track Order
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
}
