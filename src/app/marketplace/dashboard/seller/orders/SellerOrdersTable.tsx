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
import { CheckCircle2, XCircle, Loader2, PackageSearch, Eye } from "lucide-react";
import Link from "next/link";
import { SellerOrder } from "@/lib/types";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { useRouter } from "next/navigation";
import FoodPrepTimeModal from "./FoodPrepTimeModal";

type SellerOrderAction = (
  sellerGroupId: string,
  prepTimeMinutes?: number,
) => Promise<{ success?: string; error?: string }>;

type SellerRowState = {
  isFoodOrder: boolean;
  sellerGroupId?: string;
  sellerGroupStatus?: string;
  rowPending: boolean;
  isPreparingFood: boolean;
  isReadyFood: boolean;
  canDispatchToHub: boolean;
  isDispatchedToHub: boolean;
  isHubVerified: boolean;
};

function getSellerRowState(order: SellerOrder): SellerRowState {
  const isFoodOrder = Boolean(order.isFoodOrder);
  const sellerGroupId = order.sellerGroups?.[0]?.id;
  const sellerGroupStatus = order.sellerGroups?.[0]?.status;

  const rowPending = sellerGroupStatus === "PENDING";
  const isPreparingFood = isFoodOrder && sellerGroupStatus === "PREPARING";
  const isReadyFood = isFoodOrder && sellerGroupStatus === "READY";

  const canDispatchToHub = !isFoodOrder && sellerGroupStatus === "ACCEPTED";
  const isDispatchedToHub =
    !isFoodOrder &&
    (sellerGroupStatus === "DISPATCHED_TO_HUB" ||
      sellerGroupStatus === "ARRIVED_AT_HUB");
  const isHubVerified = !isFoodOrder && sellerGroupStatus === "VERIFIED_AT_HUB";

  return {
    isFoodOrder,
    sellerGroupId,
    sellerGroupStatus,
    rowPending,
    isPreparingFood,
    isReadyFood,
    canDispatchToHub,
    isDispatchedToHub,
    isHubVerified,
  };
}

export default function SellerOrdersTable({
  orders,
}: {
  orders: SellerOrder[];
}) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const [isPending, startTransition] = useTransition();
  const [foodAcceptSellerGroupId, setFoodAcceptSellerGroupId] = useState<
    string | null
  >(null);
  const router = useRouter();

  const handleAction = (
    actionFn: SellerOrderAction,
    sellerGroupId?: string,
    prepTimeMinutes?: number,
  ) => {
    if (isPending) return;
    if (!sellerGroupId) {
      toast.error("Seller group not found for this order");
      return;
    }

    startTransition(async () => {
      const res = await actionFn(sellerGroupId, prepTimeMinutes);
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      if (res?.success) {
        toast.success(res.success);
      }
      router.refresh();
    });
  };

  const statusColor: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-200 text-yellow-800",
    PAID: "bg-emerald-100 text-emerald-700",
    ACCEPTED: "bg-[#e0efff] text-[#3c9ee0]",
    PREPARING: "bg-amber-100 text-amber-700",
    READY: "bg-green-100 text-green-700",
    IN_DELIVERY: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-green-100 text-green-700",
    COMPLETED: "bg-green-200 text-green-800",
    CANCELLED: "bg-red-100 text-red-700",
    RETURN_REQUESTED: "bg-orange-200 text-orange-800",
    RETURNED: "bg-red-200 text-red-800",
    REFUNDED: "bg-gray-200 text-gray-800",

    // legacy fallback
    PENDING: "bg-yellow-200 text-yellow-800",
    SHIPPED: "bg-purple-100 text-purple-700",
    OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
  };

  const handleAcceptClick = (state: SellerRowState) => {
    if (!state.sellerGroupId) {
      toast.error("Seller group not found for this order");
      return;
    }

    if (!state.isFoodOrder) {
      handleAction(acceptOrderAction, state.sellerGroupId);
      return;
    }

    setFoodAcceptSellerGroupId(state.sellerGroupId);
  };

  const handleConfirmFoodEta = (prepTimeMinutes: number) => {
    if (!foodAcceptSellerGroupId) return;
    handleAction(acceptOrderAction, foodAcceptSellerGroupId, prepTimeMinutes);
    setFoodAcceptSellerGroupId(null);
  };

  const renderOpsButton = (order: SellerOrder, state: SellerRowState) => {
    const {
      isFoodOrder,
      sellerGroupId,
      isPreparingFood,
      isReadyFood,
      canDispatchToHub,
      isDispatchedToHub,
      isHubVerified,
    } = state;

    const showButton = isFoodOrder
      ? isPreparingFood || isReadyFood
      : canDispatchToHub || isDispatchedToHub || isHubVerified;

    if (!showButton) return null;

    return (
      <Button
        size="sm"
        disabled={
          isPending ||
          !sellerGroupId ||
          (isFoodOrder ? isReadyFood : !canDispatchToHub)
        }
        onClick={() => {
          if (!sellerGroupId) return;

          if (isFoodOrder && !isReadyFood) {
            handleAction(shipOrderAction, sellerGroupId);
            return;
          }

          if (!isFoodOrder && canDispatchToHub) {
            handleAction(shipOrderAction, sellerGroupId);
          }
        }}
        className="flex gap-1 bg-[#3c9ee0] text-white hover:bg-[#318bc4]"
      >
        {isFoodOrder
          ? isReadyFood
            ? "Ready for Pickup"
            : "Food is Ready"
          : isHubVerified
            ? "Hub Verified"
            : isDispatchedToHub
              ? "Dispatched to Hub"
              : "Dispatch to Hub"}
      </Button>
    );
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

            {orders.map((o) => {
              const state = getSellerRowState(o);
              return (
                <tr key={o.id} className="border-t transition-colors hover:bg-gray-50">
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
                        statusColor[o.status] ?? "bg-gray-100 text-gray-700"
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

                      {state.rowPending && (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending || !state.sellerGroupId}
                            onClick={() => handleAcceptClick(state)}
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
                            disabled={isPending || !state.sellerGroupId}
                            variant="destructive"
                            onClick={() => handleAction(cancelOrderAction, state.sellerGroupId)}
                            className="flex gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      )}

                      {renderOpsButton(o, state)}
                    </div>
                  </td>
                </tr>
              );
            })}
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

        {orders.map((o) => {
          const state = getSellerRowState(o);
          return (
            <Card key={o.id} className="rounded-xl border bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold">#{o.id.slice(-6)}</CardTitle>
                  <span
                    className={`rounded-full px-2 py-[2px] text-[11px] font-semibold ${
                      statusColor[o.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {o.status.replaceAll("_", " ")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 pb-3">
                <p className="text-sm text-gray-600">
                  Customer: <span className="font-medium">{o.customer?.name ?? "-"}</span>
                </p>

                <p className="text-sm text-gray-600">
                  Delivery: <span className="font-semibold text-[#3c9ee0]">{o.deliveryType.replaceAll("_", " ")}</span>
                </p>

                <p className="text-lg font-bold text-gray-900">{formatMoneyFromUSD(o.totalAmount)}</p>
              </CardContent>

              <CardFooter className="flex flex-wrap justify-between gap-2 pt-0">
                <Link href={`/marketplace/dashboard/seller/orders/${o.id}`}>
                  <Button size="sm" variant="outline" className="w-full">
                    <Eye className="mr-1 h-4 w-4" /> View
                  </Button>
                </Link>

                {state.rowPending && (
                  <>
                    <Button
                      size="sm"
                      disabled={isPending || !state.sellerGroupId}
                      onClick={() => handleAcceptClick(state)}
                      className="flex-1 bg-[#3c9ee0] text-white hover:bg-[#318bc4]"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
                    </Button>

                    <Button
                      size="sm"
                      disabled={isPending || !state.sellerGroupId}
                      variant="destructive"
                      onClick={() => handleAction(cancelOrderAction, state.sellerGroupId)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {renderOpsButton(o, state) && (
                  <div className="flex-1">{renderOpsButton(o, state)}</div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <FoodPrepTimeModal
        open={Boolean(foodAcceptSellerGroupId)}
        onOpenChange={(open) => {
          if (!open) setFoodAcceptSellerGroupId(null);
        }}
        onConfirm={handleConfirmFoodEta}
        isSubmitting={isPending}
      />
    </div>
  );
}
