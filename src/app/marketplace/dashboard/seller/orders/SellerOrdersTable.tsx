"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  acceptOrderAction,
  cancelOrderAction,
  type SellerOrderActionResult,
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
  Loader2,
  PackageSearch,
  Eye,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { SellerOrder } from "@/lib/types";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { useRouter } from "next/navigation";
import FoodPrepTimeModal from "./FoodPrepTimeModal";
import SellerCancelOrderDialog from "./SellerCancelOrderDialog";
import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import DisputeReasonLabel from "@/components/disputes/DisputeReasonLabel";
import type { SellerCancelOrderInput } from "@/lib/orders/sellerCancellation";

type SellerOrderAction = (
  sellerGroupId: string,
  prepTimeMinutes?: number,
) => Promise<SellerOrderActionResult>;

const GENERIC_SELLER_ORDER_TOAST_ERROR =
  "We couldn't update this order right now. Please refresh and try again.";

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
  const isPaymentPending = order.status === "PENDING_PAYMENT";

  const rowPending = sellerGroupStatus === "PENDING" && !isPaymentPending;
  const isPreparingFood = isFoodOrder && sellerGroupStatus === "PREPARING";
  const isReadyFood = isFoodOrder && sellerGroupStatus === "READY";

  const canDispatchToHub =
    !isFoodOrder && sellerGroupStatus === "ACCEPTED" && !isPaymentPending;
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

const surfaceClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950";
const subtlePanelClass =
  "rounded-xl border border-slate-200/70 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/70";
const tokenClass =
  "inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
const infoLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500";
const infoValueClass =
  "text-sm font-medium text-slate-700 dark:text-zinc-200";
const ghostActionClass =
  "h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 shadow-sm transition hover:border-[#3c9ee0]/35 hover:bg-[#3c9ee0]/[0.06] hover:text-[#256fa6] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-[#3c9ee0]/45 dark:hover:bg-[#3c9ee0]/10 dark:hover:text-[#72bdf0]";
const primaryActionClass =
  "h-9 rounded-xl border border-[#3c9ee0]/20 bg-[#3c9ee0] px-3 text-white shadow-[0_14px_34px_-20px_rgba(60,158,224,0.95)] transition hover:bg-[#318bc4] hover:shadow-[0_18px_36px_-20px_rgba(49,139,196,0.95)]";
const dangerActionClass =
  "h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50";

export default function SellerOrdersTable({
  orders,
}: {
  orders: SellerOrder[];
}) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const [isPending, startTransition] = useTransition();
  const inFlightActionRef = useRef<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [foodAcceptSellerGroupId, setFoodAcceptSellerGroupId] = useState<
    string | null
  >(null);
  const [cancelDialogState, setCancelDialogState] = useState<{
    sellerGroupId: string;
    storeName?: string | null;
  } | null>(null);
  const router = useRouter();

  const runAction = (
    actionKey: string,
    task: () => Promise<SellerOrderActionResult>,
    options?: { onSuccess?: () => void },
  ) => {
    if (inFlightActionRef.current) return;

    inFlightActionRef.current = actionKey;
    setPendingActionKey(actionKey);

    startTransition(async () => {
      try {
        const res = await task();

        if (res?.error) {
          toast.error(GENERIC_SELLER_ORDER_TOAST_ERROR);
          return;
        }

        if (res?.success) {
          toast.success(res.success);
        }

        options?.onSuccess?.();
        router.refresh();
      } finally {
        inFlightActionRef.current = null;
        setPendingActionKey(null);
      }
    });
  };

  const handleAction = (
    actionName: string,
    actionFn: SellerOrderAction,
    sellerGroupId?: string,
    prepTimeMinutes?: number,
  ) => {
    if (inFlightActionRef.current) return;
    if (!sellerGroupId) {
      toast.error(GENERIC_SELLER_ORDER_TOAST_ERROR);
      return;
    }

    runAction(`${actionName}:${sellerGroupId}`, () =>
      actionFn(sellerGroupId, prepTimeMinutes),
    );
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
  };

  const handleAcceptClick = (state: SellerRowState) => {
    if (!state.sellerGroupId) {
      toast.error(GENERIC_SELLER_ORDER_TOAST_ERROR);
      return;
    }

    if (!state.isFoodOrder) {
      handleAction("accept", acceptOrderAction, state.sellerGroupId);
      return;
    }

    setFoodAcceptSellerGroupId(state.sellerGroupId);
  };

  const handleConfirmFoodEta = (prepTimeMinutes: number) => {
    if (!foodAcceptSellerGroupId) return;
    handleAction(
      "accept",
      acceptOrderAction,
      foodAcceptSellerGroupId,
      prepTimeMinutes,
    );
    setFoodAcceptSellerGroupId(null);
  };

  const handleCancelSubmit = (input: SellerCancelOrderInput) => {
    if (inFlightActionRef.current) return;

    runAction(`cancel:${input.sellerGroupId}`, () => cancelOrderAction(input), {
      onSuccess: () => setCancelDialogState(null),
    });
  };

  const isActionPending = Boolean(pendingActionKey) || isPending;

  const getStatusBadgeClass = (status: string) =>
    `inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-sm ${
      statusColor[status] ?? "bg-gray-100 text-gray-700"
    }`;

  const getDeliveryBadgeClass = () =>
    "inline-flex items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]";

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
          isActionPending ||
          !sellerGroupId ||
          (isFoodOrder ? isReadyFood : !canDispatchToHub)
        }
        onClick={() => {
          if (!sellerGroupId) return;

          if (isFoodOrder && !isReadyFood) {
            handleAction("ship", shipOrderAction, sellerGroupId);
            return;
          }

          if (!isFoodOrder && canDispatchToHub) {
            handleAction("ship", shipOrderAction, sellerGroupId);
          }
        }}
        className={primaryActionClass}
      >
        {pendingActionKey === `ship:${sellerGroupId}` ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFoodOrder ? (
          isReadyFood
            ? "Ready for Pickup"
            : "Food is Ready"
        ) : isHubVerified ? (
          "Hub Verified"
        ) : isDispatchedToHub ? (
          "Dispatched to Hub"
        ) : (
          "Dispatch to Hub"
        )}
      </Button>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]">
            Seller Operations
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-zinc-100">
              Orders
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Review incoming orders, resolve disputes, and move fulfillment
              forward from one branded workspace.
            </p>
          </div>
        </div>

        <div className={`${subtlePanelClass} flex items-center gap-3 px-4 py-3`}>
          <div className="rounded-xl bg-[#3c9ee0]/10 p-2 text-[#3c9ee0] dark:bg-[#3c9ee0]/15">
            <PackageSearch className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              Visible Orders
            </p>
            <p className="text-lg font-semibold text-slate-950 dark:text-zinc-100">
              {orders.length}
            </p>
          </div>
        </div>
      </div>

      <div className={`hidden overflow-hidden lg:block ${surfaceClass}`}>
        <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(60,158,224,0.08),rgba(255,255,255,0.96))] px-6 py-4 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(60,158,224,0.12),rgba(24,24,27,0.96))]">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_1fr_0.85fr_1.35fr] gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
            <span>Order</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Dispute</span>
            <span>Delivery</span>
            <span className="text-right">Actions</span>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 hidden">
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Dispute</th>
              <th>Delivery</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-0">
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                    <div className="rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 p-4 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
                      <PackageSearch className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                        No orders yet
                      </p>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        New seller orders will appear here with their actions,
                        fulfillment state, and dispute context.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {orders.map((o) => {
              const state = getSellerRowState(o);
              const opsButton = renderOpsButton(o, state);

              return (
                <tr
                  key={o.id}
                  className="border-t border-slate-200/80 transition-colors hover:bg-slate-50/70 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                >
                  <td className="p-6 align-top">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-2 text-[#3c9ee0] shadow-sm dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
                          <PackageSearch className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <Link
                            href={`/marketplace/dashboard/seller/orders/${o.id}`}
                            className="inline-flex items-center gap-2 text-base font-semibold text-slate-950 transition hover:text-[#256fa6] dark:text-zinc-100 dark:hover:text-[#72bdf0]"
                          >
                            <span className={tokenClass}>#{o.id.slice(-6)}</span>
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Marketplace order token
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-6 align-top">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                        {o.customer?.name ?? "-"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Customer
                      </p>
                    </div>
                  </td>

                  <td className="p-6 align-top">
                    <div className="space-y-1">
                      <p className="text-lg font-bold tracking-tight text-slate-950 dark:text-zinc-100">
                        {formatMoneyFromUSD(o.totalAmount)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Total amount
                      </p>
                    </div>
                  </td>

                  <td className="p-6 align-top">
                    <span className={getStatusBadgeClass(o.status)}>
                      {o.status.replaceAll("_", " ")}
                    </span>
                  </td>

                  <td className="p-6 align-top">
                    {o.dispute ? (
                      <div className="space-y-2">
                        <DisputeStatusBadge status={o.dispute.status} />
                        <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                          <DisputeReasonLabel reason={o.dispute.reason} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                        No dispute
                      </span>
                    )}
                  </td>

                  <td className="p-6 align-top">
                    <span className={getDeliveryBadgeClass()}>
                      {o.deliveryType.replaceAll("_", " ")}
                    </span>
                  </td>

                  <td className="p-6 align-top">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/marketplace/dashboard/seller/orders/${o.id}`}>
                        <Button size="sm" variant="outline" className={ghostActionClass}>
                          <Eye className="mr-1.5 h-4 w-4" />
                          View
                        </Button>
                      </Link>

                      {o.dispute ? (
                        <Link
                          href={`/marketplace/dashboard/seller/disputes/${o.dispute.id}`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className={ghostActionClass}
                          >
                            <AlertTriangle className="mr-1.5 h-4 w-4" />
                            Dispute
                          </Button>
                        </Link>
                      ) : null}

                      {state.rowPending && (
                        <>
                          <Button
                            size="sm"
                            disabled={isActionPending || !state.sellerGroupId}
                            onClick={() => handleAcceptClick(state)}
                            className={primaryActionClass}
                          >
                            {pendingActionKey === `accept:${state.sellerGroupId}` ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            )}
                            Accept
                          </Button>

                          <Button
                            size="sm"
                            disabled={isActionPending || !state.sellerGroupId}
                            variant="destructive"
                            onClick={() =>
                              setCancelDialogState({
                                sellerGroupId: state.sellerGroupId!,
                                storeName: o.sellerGroups?.[0]?.store?.name,
                              })
                            }
                            className={dangerActionClass}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      )}

                      {opsButton}
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
          <div className={`${surfaceClass} px-6 py-16 text-center`}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
              <PackageSearch className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              No orders yet
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Orders will appear here once buyers start checking out from your
              store.
            </p>
          </div>
        )}

        {orders.map((o) => {
          const state = getSellerRowState(o);
          const opsButton = renderOpsButton(o, state);

          return (
            <Card
              key={o.id}
              className={`${surfaceClass} overflow-hidden border-slate-200/80`}
            >
              <CardHeader className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(60,158,224,0.09),rgba(255,255,255,0.96))] pb-4 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(60,158,224,0.12),rgba(24,24,27,0.96))]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span className={tokenClass}>#{o.id.slice(-6)}</span>
                    <CardTitle className="text-base font-semibold text-slate-950 dark:text-zinc-100">
                      Seller Order
                    </CardTitle>
                  </div>
                  <span className={getStatusBadgeClass(o.status)}>
                    {o.status.replaceAll("_", " ")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-4">
                <div className={`${subtlePanelClass} grid grid-cols-2 gap-3 p-3`}>
                  <div className="space-y-1">
                    <p className={infoLabelClass}>Customer</p>
                    <p className={infoValueClass}>{o.customer?.name ?? "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className={infoLabelClass}>Delivery</p>
                    <span className={getDeliveryBadgeClass()}>
                      {o.deliveryType.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className={infoLabelClass}>Amount</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-zinc-100">
                      {formatMoneyFromUSD(o.totalAmount)}
                    </p>
                  </div>
                </div>

                {o.dispute ? (
                  <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="mb-2 flex items-center gap-2">
                      <DisputeStatusBadge status={o.dispute.status} />
                    </div>
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      <DisputeReasonLabel reason={o.dispute.reason} />
                    </p>
                  </div>
                ) : null}
              </CardContent>

              <CardFooter className="flex flex-col gap-3 border-t border-slate-200/80 bg-slate-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="grid w-full grid-cols-2 gap-2">
                  <Link
                    href={`/marketplace/dashboard/seller/orders/${o.id}`}
                    className="w-full"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className={`w-full ${ghostActionClass}`}
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      View
                    </Button>
                  </Link>

                  {o.dispute ? (
                    <Link
                      href={`/marketplace/dashboard/seller/disputes/${o.dispute.id}`}
                      className="w-full"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className={`w-full ${ghostActionClass}`}
                      >
                        <AlertTriangle className="mr-1.5 h-4 w-4" />
                        Dispute
                      </Button>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>

                {state.rowPending && (
                  <div className="grid w-full grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      disabled={isActionPending || !state.sellerGroupId}
                      onClick={() => handleAcceptClick(state)}
                      className={`w-full ${primaryActionClass}`}
                    >
                      {pendingActionKey === `accept:${state.sellerGroupId}` ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      )}
                      Accept
                    </Button>

                    <Button
                      size="sm"
                      disabled={isActionPending || !state.sellerGroupId}
                      variant="destructive"
                      onClick={() =>
                        setCancelDialogState({
                          sellerGroupId: state.sellerGroupId!,
                          storeName: o.sellerGroups?.[0]?.store?.name,
                        })
                      }
                      className={`w-full ${dangerActionClass}`}
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}

                {opsButton ? <div className="w-full">{opsButton}</div> : null}
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
        isSubmitting={isActionPending}
      />
      <SellerCancelOrderDialog
        open={Boolean(cancelDialogState)}
        onOpenChange={(open) => {
          if (!open) setCancelDialogState(null);
        }}
        sellerGroupId={cancelDialogState?.sellerGroupId ?? null}
        storeName={cancelDialogState?.storeName}
        isSubmitting={isActionPending}
        onSubmit={handleCancelSubmit}
      />
    </div>
  );
}
