"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBaseUSD } from "@/lib/currency/formatBaseUSD";
import { OrderHistoryDTO } from "@/lib/types";

type Props = {
  orders: OrderHistoryDTO;
};

const OrderHistoryCard = ({ orders }: Props) => {
  const formatOrderDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <main className="max-w-6xl mx-auto px-4 ">
      <h1 className="text-3xl font-semibold mb-6">Your Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => {
          if (!order.items.length) return null;
          const firstItem = order.items[0];

          const image =
            firstItem?.product.images?.[0]?.imageUrl || "/placeholder.png";

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm p-6 hover:shadow transition"
            >
              {/* Top Section */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">
                    ORDER PLACED:
                    <span className="font-medium text-gray-900 dark:text-gray-400">
                      {""} {formatOrderDate(order.createdAt)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    TOTAL:
                    <span className="font-medium text-gray-900 dark:text-gray-400">
                      {""} {formatBaseUSD(order.totalAmount)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    ORDER ID:
                    <span className="text-[13px] font-mono">
                      {""} {order.id.slice(0, 12)}...
                    </span>
                  </p>
                </div>

                <Badge
                  className={`text-white px-3 py-1 rounded-md text-xs font-semibold ${
                    order.status === "DELIVERED"
                      ? "bg-green-600"
                      : order.status === "COMPLETED"
                        ? "bg-green-700"
                        : order.status === "SHIPPED"
                          ? "bg-purple-600"
                          : order.status === "ACCEPTED"
                            ? "bg-blue-600"
                            : order.status === "PENDING"
                              ? "bg-yellow-600"
                              : order.status === "CANCELLED"
                                ? "bg-red-600"
                                : "bg-gray-500"
                  }`}
                >
                  {order.status}
                </Badge>
              </div>

              {/* Product Preview */}
              <div className="flex gap-5 items-start mt-5">
                <div className="relative w-24 h-24 border rounded-md bg-gray-50 dark:bg-neutral-900 overflow-hidden">
                  <Image
                    src={image}
                    alt={firstItem.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
        font-medium text-[15px] mb-1
        line-clamp-2
        leading-snug
        dark:text-gray-400
      "
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

              <div className="flex flex-wrap gap-3 mt-6">
                <Link href={`/customer/order/${order.id}`}>
                  <Button variant="secondary" className="rounded-md ">
                    View Order Details
                  </Button>
                </Link>

                {order.status !== "DELIVERED" &&
                  order.status !== "COMPLETED" &&
                  order.status !== "CANCELLED" && (
                    <Link
                      href={`/customer/order/track/tn/${order.trackingNumber}`}
                    >
                      <Button className="rounded-md bg-blue-600 hover:bg-blue-700">
                        Track Package
                      </Button>
                    </Link>
                  )}

                {(order.status === "DELIVERED" ||
                  order.status === "COMPLETED") && (
                  <Link href={`/customer/order/${order.id}#review`}>
                    <Button
                      variant="outline"
                      className="rounded-md border-gray-400"
                    >
                      Write a Product Review
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default OrderHistoryCard;
