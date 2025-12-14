import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const userId = await CurrentUserId();
  if (!userId)
    return (
      <p className="text-center py-40 text-gray-500 text-lg">
        Login required to view orders
      </p>
    );

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
    },
  });

  if (orders.length === 0)
    return (
      <div className="text-center py-40">
        <p className="text-gray-500 text-lg mb-4">You have no orders yet</p>
        <Link href="/">
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium">
            Start Shopping
          </Button>
        </Link>
      </div>
    );

  return (
    <main className="max-w-6xl mx-auto px-4 ">
      <h1 className="text-3xl font-semibold mb-6">Your Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => {
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
                    ORDER PLACED:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    TOTAL:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ₦{order.totalAmount.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    ORDER ID:{" "}
                    <span className="text-[13px] font-mono">
                      {order.id.slice(0, 12)}...
                    </span>
                  </p>
                </div>

                <Badge
                  className={`text-white px-3 py-1 rounded-md text-xs font-semibold ${
                    order.status === "DELIVERED"
                      ? "bg-green-600"
                      : order.status === "SHIPPED"
                      ? "bg-blue-600"
                      : order.status === "PENDING"
                      ? "bg-yellow-600"
                      : "bg-gray-500"
                  }`}
                >
                  {order.status}
                </Badge>
              </div>

              {/* Middle — Product Preview */}
              <div className="flex gap-5 items-start mt-5">
                <div className="relative w-24 h-24 border rounded-md bg-gray-50 overflow-hidden">
                  <Image
                    src={image}
                    alt={firstItem.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-[15px] mb-1">
                    {firstItem.product.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {order.items.length > 1
                      ? `+ ${order.items.length - 1} more item(s)`
                      : `${firstItem.quantity} item`}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Link href={`/customer/order/${order.id}`}>
                  <Button variant="secondary" className="rounded-md">
                    View Order Details
                  </Button>
                </Link>

                {order.status !== "DELIVERED" &&
                  order.status !== "CANCELLED" && (
                    <Link href={`/customer/order/track/${order.id}`}>
                      <Button className="rounded-md bg-blue-600 hover:bg-blue-700">
                        Track Package
                      </Button>
                    </Link>
                  )}

                {order.status === "DELIVERED" && (
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
}
