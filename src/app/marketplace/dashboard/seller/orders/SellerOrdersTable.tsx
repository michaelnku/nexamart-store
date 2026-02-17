"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  acceptOrderAction,
  cancelOrderAction,
  shipOrderAction,
} from "@/actions/order/sellerOrderActions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [optimisticShipped, setOptimisticShipped] = useState<Set<string>>(
    () => new Set(),
  );

  const handleAction = (
    actionFn: SellerOrderAction,
    sellerGroupId?: string,
    onSuccess?: () => void,
  ) => {
    if (isPending) return;
    if (!sellerGroupId) {
      toast.error("Seller group not found for this order");
      return;
    }

    startTransition(async () => {
      const res = await actionFn(sellerGroupId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success(res.success);
      onSuccess?.();
    });
  };

  const statusColor: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-200 text-yellow-800",
    ACCEPTED: "bg-[#e0efff] text-[#3c9ee0]",
    SHIPPED: "bg-purple-100 text-purple-700",
    OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-green-100 text-green-700",
    COMPLETED: "bg-green-200 text-green-800",
    CANCELLED: "bg-red-100 text-red-700",
    RETURN_REQUESTED: "bg-orange-200 text-orange-800",
    RETURNED: "bg-red-200 text-red-800",
    REFUNDED: "bg-gray-200 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>

      <div className="hidden lg:block overflow-hidden rounded-xl border bg-white shadow">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b bg-gray-50">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
              <th className="p-4 font-medium">Order</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Delivery</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-500">
                  <PackageSearch className="mx-auto mb-2 h-6 w-6 opacity-70" />
                  No orders yet
                </td>
              </tr>
            )}

            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-t transition-colors hover:bg-gray-50"
              >
                {(() => {
                  const sellerGroupId = o.sellerGroups?.[0]?.id;
                  const sellerGroupStatus = o.sellerGroups?.[0]?.status;
                  const isPendingPickup = sellerGroupStatus === "PENDING_PICKUP";
                  const canMarkAsShipped =
                    sellerGroupStatus === "IN_TRANSIT_TO_HUB";
                  const isShipped =
                    sellerGroupStatus === "ARRIVED_AT_HUB" ||
                    o.status === "SHIPPED" ||
                    (!!sellerGroupId && optimisticShipped.has(sellerGroupId));

                  return (
                    <>
                      <td className="p-4 font-medium">
                        <Link
                          href={`/marketplace/dashboard/seller/orders/${o.id}`}
                          className="hover:underline"
                        >
                          #{o.id.slice(-6)}
                        </Link>
                      </td>

                      <td className="p-4 font-medium">{o.customer?.name ?? "-"}</td>

                      <td className="p-4 font-semibold text-gray-900">
                        {formatMoneyFromUSD(o.totalAmount)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-[3px] text-[11px] font-semibold ${
                            statusColor[o.status]
                          }`}
                        >
                          {o.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="rounded-full bg-[#3c9ee0]/10 px-2 py-[3px] text-[11px] font-medium text-[#3c9ee0]">
                          {o.deliveryType.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/marketplace/dashboard/seller/orders/${o.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {isPendingPickup && (
                            <>
                              <Button
                                size="sm"
                                disabled={isPending || !sellerGroupId}
                                onClick={() =>
                                  handleAction(acceptOrderAction, sellerGroupId)
                                }
                                className="flex gap-1 bg-[#3c9ee0] text-white hover:bg-[#318bc4]"
                              >
                                {isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                Accept
                              </Button>

                              <Button
                                size="sm"
                                disabled={isPending || !sellerGroupId}
                                variant="destructive"
                                onClick={() =>
                                  handleAction(cancelOrderAction, sellerGroupId)
                                }
                                className="flex gap-1"
                              >
                                <XCircle className="h-4 w-4" />
                                Cancel
                              </Button>
                            </>
                          )}

                          {(canMarkAsShipped || isShipped) && (
                            <Button
                              size="sm"
                              disabled={
                                isPending || !sellerGroupId || !canMarkAsShipped
                              }
                              onClick={() => {
                                if (!canMarkAsShipped) return;
                                handleAction(shipOrderAction, sellerGroupId, () => {
                                  if (!sellerGroupId) return;
                                  setOptimisticShipped((prev) =>
                                    new Set(prev).add(sellerGroupId),
                                  );
                                });
                              }}
                              className="flex gap-1 bg-[#3c9ee0] text-white hover:bg-[#318bc4]"
                            >
                              <Truck className="h-4 w-4" />
                              {isShipped ? "Shipped" : "Mark as Shipped"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 lg:hidden">
        {orders.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <PackageSearch className="mx-auto mb-2 h-6 w-6 opacity-70" />
            No orders yet
          </div>
        )}

        {orders.map((o) => (
          <Card key={o.id} className="rounded-xl border bg-white shadow-sm">
            {(() => {
              const sellerGroupId = o.sellerGroups?.[0]?.id;
              const sellerGroupStatus = o.sellerGroups?.[0]?.status;
              const isPendingPickup = sellerGroupStatus === "PENDING_PICKUP";
              const canMarkAsShipped =
                sellerGroupStatus === "IN_TRANSIT_TO_HUB";
              const isShipped =
                sellerGroupStatus === "ARRIVED_AT_HUB" ||
                o.status === "SHIPPED" ||
                (!!sellerGroupId && optimisticShipped.has(sellerGroupId));

              return (
                <>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base font-semibold">
                        #{o.id.slice(-6)}
                      </CardTitle>
                      <span
                        className={`rounded-full px-2 py-[2px] text-[11px] font-semibold ${
                          statusColor[o.status]
                        }`}
                      >
                        {o.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 pb-3">
                    <p className="text-sm text-gray-600">
                      Customer:{" "}
                      <span className="font-medium">{o.customer?.name ?? "-"}</span>
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
                  </CardContent>

                  <CardFooter className="flex flex-wrap justify-between gap-2 pt-0">
                    <Link href={`/marketplace/dashboard/seller/orders/${o.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    </Link>

                    {isPendingPickup && (
                      <>
                        <Button
                          size="sm"
                          disabled={isPending || !sellerGroupId}
                          onClick={() =>
                            handleAction(acceptOrderAction, sellerGroupId)
                          }
                          className="flex-1 bg-[#3c9ee0] text-white hover:bg-[#318bc4]"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Accept"
                          )}
                        </Button>

                        <Button
                          size="sm"
                          disabled={isPending || !sellerGroupId}
                          variant="destructive"
                          onClick={() =>
                            handleAction(cancelOrderAction, sellerGroupId)
                          }
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {(canMarkAsShipped || isShipped) && (
                      <Button
                        size="sm"
                        disabled={isPending || !sellerGroupId || !canMarkAsShipped}
                        onClick={() => {
                          if (!canMarkAsShipped) return;
                          handleAction(shipOrderAction, sellerGroupId, () => {
                            if (!sellerGroupId) return;
                            setOptimisticShipped((prev) =>
                              new Set(prev).add(sellerGroupId),
                            );
                          });
                        }}
                        className="flex-1 bg-[#3c9ee0] text-white hover:bg-[#318bc4]"
                      >
                        {isShipped ? "Shipped" : "Mark as Shipped"}
                      </Button>
                    )}
                  </CardFooter>
                </>
              );
            })()}
          </Card>
        ))}
      </div>
    </div>
  );
}
