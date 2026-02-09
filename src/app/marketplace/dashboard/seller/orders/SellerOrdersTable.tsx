"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  acceptOrderAction,
  cancelOrderAction,
  shipOrderAction,
} from "@/actions/order/sellerOrderActions";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  PackageSearch,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { OrderStatus, SellerOrder } from "@/lib/types";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";

type SellerOrderAction = (
  sellerGroupId: string,
) => Promise<{ success?: string; error?: string }>;

export default function SellerOrdersTable({
  orders,
}: {
  orders: SellerOrder[];
}) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  const [isPending, startTransition] = useTransition();

  const handleAction = (actionFn: SellerOrderAction, id: string) => {
    if (isPending) return;

    startTransition(async () => {
      const res = await actionFn(id);
      res?.error ? toast.error(res.error) : toast.success(res.success);
    });
  };

  const statusColor: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-200 text-yellow-800",
    PROCESSING: "bg-[#e0efff] text-[#3c9ee0]",
    SHIPPED: "bg-purple-100 text-purple-700",
    IN_TRANSIT: "bg-purple-200 text-purple-800",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    RETURNED: "bg-red-200 text-red-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>

      <div className="hidden md:block overflow-hidden rounded-xl border bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10 border-b">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
              <th className="p-4 font-medium">Order</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Delivery</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-500">
                  <PackageSearch className="w-6 h-6 mx-auto mb-2 opacity-70" />
                  No orders yet
                </td>
              </tr>
            )}

            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 font-medium">
                  <Link
                    href={`/marketplace/dashboard/seller/orders/${o.id}`}
                    className="hover:underline"
                  >
                    #{o.id.slice(-6)}
                  </Link>
                </td>

                <td className="p-4 font-medium">{o.customer?.name ?? "—"}</td>

                <td className="p-4 font-semibold text-gray-900">
                  {formatMoneyFromUSD(o.totalAmount)}
                </td>

                <td className="p-4">
                  <span
                    className={`px-2 py-[3px] text-[11px] rounded-full font-semibold ${
                      statusColor[o.status]
                    }`}
                  >
                    {o.status.replaceAll("_", " ")}
                  </span>
                </td>

                <td className="p-4">
                  <span className="px-2 py-[3px] text-[11px] rounded-full bg-[#3c9ee0]/10 text-[#3c9ee0] font-medium">
                    {o.deliveryType.replaceAll("_", " ")}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex justify-end gap-2 flex-wrap">
                    <Link href={`/marketplace/dashboard/seller/orders/${o.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>

                    {o.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleAction(acceptOrderAction, o.id)}
                          className="flex gap-1 bg-[#3c9ee0] hover:bg-[#318bc4] text-white"
                        >
                          {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Accept
                        </Button>

                        <Button
                          size="sm"
                          disabled={isPending}
                          variant="destructive"
                          onClick={() => handleAction(cancelOrderAction, o.id)}
                          className="flex gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </Button>
                      </>
                    )}

                    {o.status === "PROCESSING" && (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleAction(shipOrderAction, o.id)}
                        className="flex gap-1 bg-[#3c9ee0] hover:bg-[#318bc4] text-white"
                      >
                        <Truck className="w-4 h-4" />
                        Mark as Shipped
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {orders.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <PackageSearch className="w-6 h-6 mx-auto mb-2 opacity-70" />
            No orders yet
          </div>
        )}

        {orders.map((o) => (
          <div
            key={o.id}
            className="border rounded-xl bg-white p-4 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold">#{o.id.slice(-6)}</p>
              <span
                className={`px-2 py-[2px] text-[11px] rounded-full font-semibold ${
                  statusColor[o.status]
                }`}
              >
                {o.status.replaceAll("_", " ")}
              </span>
            </div>

            <p className="text-sm text-gray-600">
              Customer:{" "}
              <span className="font-medium">{o.customer?.name ?? "—"}</span>
            </p>

            <p className="text-sm text-gray-600">
              Delivery:{" "}
              <span className="font-semibold text-[#3c9ee0]">
                {o.deliveryType.replaceAll("_", " ")}
              </span>
            </p>

            <p className="text-lg font-bold text-gray-900">
              {formatMoneyFromUSD(o.totalAmount)}
            </p>

            <div className="flex flex-wrap gap-2 justify-between pt-2">
              <Link href={`/marketplace/dashboard/seller/orders/${o.id}`}>
                <Button size="sm" variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
              </Link>

              {o.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleAction(acceptOrderAction, o.id)}
                    className="flex-1 bg-[#3c9ee0] hover:bg-[#318bc4] text-white"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Accept"
                    )}
                  </Button>

                  <Button
                    size="sm"
                    disabled={isPending}
                    variant="destructive"
                    onClick={() => handleAction(cancelOrderAction, o.id)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </>
              )}

              {o.status === "PROCESSING" && (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleAction(shipOrderAction, o.id)}
                  className="flex-1 bg-[#3c9ee0] hover:bg-[#318bc4] text-white"
                >
                  Mark as Shipped
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
