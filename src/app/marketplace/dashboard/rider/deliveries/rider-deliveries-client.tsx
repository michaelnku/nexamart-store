"use client";

import {
  getRiderDeliveriesAction,
  riderAcceptDeliveryAction,
  riderCancelAssignedDeliveryAction,
  riderVerifyDeliveryOtpAction,
} from "@/actions/rider/riderActions";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Loader2, MapPin, PackageSearch, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  canVerifyClientDeliveryStatus,
  parseRiderDeliveryStatusKey,
  RIDER_CLIENT_STATUS_LABELS,
  RIDER_CLIENT_STATUS_STYLES,
  RIDER_DELIVERY_STATUS_TABS,
  RiderDeliveryStatusKey,
} from "@/lib/rider/types";

const styles = {
  section: "mx-auto max-w-5xl space-y-6 px-4 py-6",
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  tintedSurface:
    "rounded-xl border border-slate-200/70 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/70",
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
  token:
    "inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  primaryAction:
    "h-10 rounded-xl border border-[#3c9ee0]/20 bg-[#3c9ee0] px-4 text-white shadow-[0_14px_34px_-20px_rgba(60,158,224,0.95)] transition hover:bg-[#318bc4] hover:shadow-[0_18px_36px_-20px_rgba(49,139,196,0.95)]",
  dangerAction:
    "h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50",
  verifyAction:
    "h-10 rounded-xl border border-green-200 bg-green-600 px-4 text-white shadow-[0_14px_34px_-20px_rgba(22,163,74,0.95)] transition hover:bg-green-700 dark:border-green-900/60",
};

export default function RiderDeliveriesClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const status = parseRiderDeliveryStatusKey(searchParams.get("status") ?? "");
  const [acceptingDeliveryId, setAcceptingDeliveryId] = useState<string | null>(
    null,
  );
  const [cancellingDeliveryId, setCancellingDeliveryId] = useState<
    string | null
  >(null);
  const [verifyingDeliveryId, setVerifyingDeliveryId] = useState<string | null>(
    null,
  );
  const [otpByDeliveryId, setOtpByDeliveryId] = useState<
    Record<string, string>
  >({});
  const [otpErrorByDeliveryId, setOtpErrorByDeliveryId] = useState<
    Record<string, string>
  >({});
  const [isAcceptPending, startAcceptTransition] = useTransition();
  const [isCancelPending, startCancelTransition] = useTransition();
  const [isVerifyPending, startVerifyTransition] = useTransition();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rider-deliveries", status],
    queryFn: async () => {
      return await getRiderDeliveriesAction(status);
    },
    staleTime: 1000 * 15,
  });

  const isFailure = isError || !data || "error" in data;
  const deliveries = !isLoading && !isFailure ? data.deliveries : [];
  const counts =
    !isLoading && !isFailure
      ? data.counts
      : { pending: 0, assigned: 0, ongoing: 0, delivered: 0, cancelled: 0 };
  const activeKey =
    !isLoading && !isFailure
      ? data.activeKey
      : (status as RiderDeliveryStatusKey);
  const currency = "USD";

  const handleAccept = (deliveryId: string) => {
    setAcceptingDeliveryId(deliveryId);

    startAcceptTransition(async () => {
      try {
        const res = await riderAcceptDeliveryAction(deliveryId);

        if ("error" in res) {
          toast.error(res.error);
          return;
        }

        toast.success("Delivery accepted");
        await queryClient.invalidateQueries({
          queryKey: ["rider-deliveries"],
        });
        router.push("/marketplace/dashboard/rider/deliveries?status=ongoing");
      } catch (error) {
        console.error("Failed to accept delivery:", error);
        toast.error("Failed to accept delivery");
      } finally {
        setAcceptingDeliveryId(null);
      }
    });
  };

  const handleVerifyOtp = (deliveryId: string) => {
    const otp = (otpByDeliveryId[deliveryId] ?? "").trim();

    if (!otp) {
      setOtpErrorByDeliveryId((prev) => ({
        ...prev,
        [deliveryId]: "Enter OTP from customer.",
      }));
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setOtpErrorByDeliveryId((prev) => ({
        ...prev,
        [deliveryId]: "OTP must be a 6-digit code.",
      }));
      return;
    }

    setOtpErrorByDeliveryId((prev) => ({ ...prev, [deliveryId]: "" }));
    setVerifyingDeliveryId(deliveryId);

    startVerifyTransition(async () => {
      try {
        const res = await riderVerifyDeliveryOtpAction(deliveryId, otp);

        if ("error" in res) {
          setOtpErrorByDeliveryId((prev) => ({
            ...prev,
            [deliveryId]: res?.error ?? "Failed to verify OTP.",
          }));
          return;
        }

        toast.success("Delivery verified and marked delivered");
        setOtpByDeliveryId((prev) => ({ ...prev, [deliveryId]: "" }));
        setOtpErrorByDeliveryId((prev) => ({ ...prev, [deliveryId]: "" }));
        await queryClient.invalidateQueries({
          queryKey: ["rider-deliveries"],
        });
        router.push("/marketplace/dashboard/rider/deliveries?status=ongoing");
      } catch (error) {
        console.error("Failed to verify delivery OTP:", error);
        setOtpErrorByDeliveryId((prev) => ({
          ...prev,
          [deliveryId]: "Failed to verify OTP. Please try again.",
        }));
      } finally {
        setVerifyingDeliveryId(null);
      }
    });
  };

  const handleCancelAssigned = (deliveryId: string) => {
    setCancellingDeliveryId(deliveryId);

    startCancelTransition(async () => {
      try {
        const res = await riderCancelAssignedDeliveryAction(deliveryId);

        if ("error" in res) {
          toast.error(res.error);
          return;
        }

        toast.success("Delivery assignment cancelled");
        await queryClient.invalidateQueries({
          queryKey: ["rider-deliveries"],
        });
        router.push("/marketplace/dashboard/rider/deliveries?status=pending");
      } catch (error) {
        console.error("Failed to cancel assigned delivery:", error);
        toast.error("Failed to cancel assigned delivery");
      } finally {
        setCancellingDeliveryId(null);
      }
    });
  };

  return (
    <main className={styles.section}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className={styles.eyebrow}>Rider Operations</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-zinc-100">
              Deliveries
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Track assigned trips, ongoing fulfillment, and verified handoffs.
            </p>
          </div>
        </div>

        <div className={`${styles.tintedSurface} flex items-center gap-3 px-4 py-3`}>
          <div className="rounded-xl bg-[#3c9ee0]/10 p-2 text-[#3c9ee0] dark:bg-[#3c9ee0]/15">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              Active Bucket
            </p>
            <p className="text-lg font-semibold text-slate-950 dark:text-zinc-100">
              {RIDER_CLIENT_STATUS_LABELS[activeKey]}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {RIDER_DELIVERY_STATUS_TABS.map((tab) => {
          const isActive = activeKey === tab.key;
          const count = counts[tab.key as keyof typeof counts] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() =>
                router.push(
                  `/marketplace/dashboard/rider/deliveries?status=${tab.key}`,
                )
              }
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-[#3c9ee0] bg-[#3c9ee0] text-white shadow-[0_14px_34px_-20px_rgba(60,158,224,0.95)]"
                  : "border-slate-200 bg-white text-gray-700 hover:border-[#3c9ee0]/30 hover:bg-[#3c9ee0]/[0.05] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-[#3c9ee0]/35 dark:hover:bg-[#3c9ee0]/10"
              }`}
              type="button"
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className={`flex items-center justify-center py-20 ${styles.premiumSurface}`}>
          <Spinner />
        </div>
      ) : isFailure ? (
        <p className="text-center text-red-600 py-20">
          Failed to load deliveries
        </p>
      ) : deliveries.length === 0 ? (
        <div className={`${styles.premiumSurface} p-10 text-center`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
            <PackageSearch className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">
            No deliveries in this category
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Assigned and completed delivery activity will appear here as your queue changes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => {
            const order = delivery.order;
            const otpAttempts =
              typeof delivery.otpAttempts === "number"
                ? delivery.otpAttempts
                : 0;
            const attemptsLeft = Math.max(0, 5 - otpAttempts);
            const isLocked = Boolean(delivery.isLocked);
            const formattedFee = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(delivery.fee ?? 0);

            return (
              <div
                key={delivery.id}
                className={`${styles.premiumSurface} p-5 transition hover:shadow-[0_24px_60px_-38px_rgba(15,23,42,0.4)]`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 p-3 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
                        <Bike className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span className={styles.token}>
                          {order?.trackingNumber ?? order?.id}
                        </span>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                          {order?.createdAt
                            ? new Date(order.createdAt).toDateString()
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className={`${styles.tintedSurface} grid gap-4 p-4 sm:grid-cols-3`}>
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                          Customer
                        </p>
                        <p className="font-medium text-slate-900 dark:text-zinc-100">
                          {order?.customer?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                          {order?.customer?.email ?? "-"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                          Fee
                        </p>
                        <p className="text-xl font-bold tracking-tight text-[var(--brand-blue)]">
                          {formattedFee}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                          Status
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            RIDER_CLIENT_STATUS_STYLES[delivery.clientStatus]
                          }`}
                        >
                          {RIDER_CLIENT_STATUS_LABELS[delivery.clientStatus]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#3c9ee0]" />
                      <div>
                        <span className="font-medium text-slate-700 dark:text-zinc-200">
                          Address:
                        </span>{" "}
                        {order?.deliveryAddress ?? "-"}
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-[280px] lg:shrink-0">
                    <div className="space-y-3">
                      {delivery.clientStatus === "ASSIGNED" && (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                          <Button
                            onClick={() => handleAccept(delivery.id)}
                            disabled={
                              (isAcceptPending &&
                                acceptingDeliveryId === delivery.id) ||
                              (isCancelPending &&
                                cancellingDeliveryId === delivery.id)
                            }
                            className={styles.primaryAction}
                          >
                            {isAcceptPending &&
                            acceptingDeliveryId === delivery.id ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Accepting...
                              </span>
                            ) : (
                              "Accept Delivery"
                            )}
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={() => handleCancelAssigned(delivery.id)}
                            disabled={
                              (isCancelPending &&
                                cancellingDeliveryId === delivery.id) ||
                              (isAcceptPending &&
                                acceptingDeliveryId === delivery.id)
                            }
                            className={styles.dangerAction}
                          >
                            {isCancelPending &&
                            cancellingDeliveryId === delivery.id ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cancelling...
                              </span>
                            ) : (
                              "Cancel Delivery"
                            )}
                          </Button>
                        </div>
                      )}

                      {canVerifyClientDeliveryStatus(delivery.clientStatus) && (
                        <div className={`${styles.tintedSurface} space-y-3 p-4`}>
                          <div className="flex items-start gap-2">
                            <div className="rounded-lg bg-green-100 p-2 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <label
                                htmlFor={`otp-${delivery.id}`}
                                className="text-sm font-semibold text-slate-900 dark:text-zinc-100"
                              >
                                Verify customer OTP
                              </label>
                              <p
                                className={`text-xs ${
                                  isLocked
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-500 dark:text-zinc-400"
                                }`}
                              >
                                {isLocked
                                  ? "Delivery locked after 3 invalid OTP attempts."
                                  : `${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <input
                              id={`otp-${delivery.id}`}
                              type="text"
                              inputMode="numeric"
                              placeholder="Enter 6-digit OTP"
                              value={otpByDeliveryId[delivery.id] ?? ""}
                              disabled={isLocked}
                              onChange={(e) => {
                                const next = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6);
                                setOtpByDeliveryId((prev) => ({
                                  ...prev,
                                  [delivery.id]: next,
                                }));
                                setOtpErrorByDeliveryId((prev) => ({
                                  ...prev,
                                  [delivery.id]: "",
                                }));
                              }}
                              className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                            />

                            <Button
                              onClick={() => handleVerifyOtp(delivery.id)}
                              disabled={
                                isLocked ||
                                (isVerifyPending &&
                                  verifyingDeliveryId === delivery.id)
                              }
                              className={styles.verifyAction}
                            >
                              {isVerifyPending &&
                              verifyingDeliveryId === delivery.id ? (
                                <span className="inline-flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Verifying...
                                </span>
                              ) : (
                                "Verify OTP & Deliver"
                              )}
                            </Button>
                          </div>

                          {otpErrorByDeliveryId[delivery.id] && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {otpErrorByDeliveryId[delivery.id]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
