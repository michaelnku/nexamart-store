"use client";

import {
  getRiderDeliveriesAction,
  riderAcceptDeliveryAction,
  riderVerifyDeliveryOtpAction,
} from "@/actions/rider/riderActions";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "pending", label: "Pending" },
  { key: "assigned", label: "Assigned" },
  { key: "ongoing", label: "Ongoing" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]["key"];

export default function RiderDeliveriesClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") ?? "assigned") as StatusKey;
  const [acceptingDeliveryId, setAcceptingDeliveryId] = useState<string | null>(
    null,
  );
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
    !isLoading && !isFailure ? data.activeKey : (status as StatusKey);
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

  return (
    <main className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deliveries</h1>
        <p className="text-sm text-gray-500">
          Track your assigned and in-progress deliveries.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
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
              className={`px-4 py-2 rounded-full text-sm border transition ${
                isActive
                  ? "bg-[#3c9ee0] text-white border-[#3c9ee0]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
              type="button"
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 border dark:bg-neutral-950 rounded-xl shadow-sm">
          <Spinner />
        </div>
      ) : isFailure ? (
        <p className="text-center text-red-600 py-20">
          Failed to load deliveries
        </p>
      ) : deliveries.length === 0 ? (
        <div className="border dark:bg-neutral-950 rounded-xl shadow-sm p-8 text-center text-gray-500">
          No deliveries in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => {
            const order = delivery.order;
            const otpAttempts =
              typeof delivery.otpAttempts === "number"
                ? delivery.otpAttempts
                : 0;
            const attemptsLeft = Math.max(0, 3 - otpAttempts);
            const isLocked = Boolean(delivery.isLocked);
            const formattedFee = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(delivery.fee ?? 0);

            return (
              <div
                key={delivery.id}
                className="border dark:bg-neutral-950 rounded-xl shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Order</p>
                    <p className="font-semibold">
                      {order?.trackingNumber ?? order?.id}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order?.createdAt
                        ? new Date(order.createdAt).toDateString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">
                      {order?.customer?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order?.customer?.email ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Fee</p>
                    <p className="font-semibold text-[var(--brand-blue)]">
                      {formattedFee}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      {delivery.status
                        .replace("_", " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Address:</span>{" "}
                  {order?.deliveryAddress ?? "-"}
                </div>

                {delivery.status === "ASSIGNED" && (
                  <div className="mt-4">
                    <Button
                      onClick={() => handleAccept(delivery.id)}
                      disabled={
                        isAcceptPending && acceptingDeliveryId === delivery.id
                      }
                      className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
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
                  </div>
                )}

                {delivery.status === "IN_TRANSIT" && (
                  <div className="mt-4 space-y-2">
                    <label
                      htmlFor={`otp-${delivery.id}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Verify customer OTP
                    </label>

                    <p
                      className={`text-xs ${
                        isLocked ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      {isLocked
                        ? "Delivery locked after 3 invalid OTP attempts."
                        : `${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left`}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
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
                        className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/20"
                      />

                      <Button
                        onClick={() => handleVerifyOtp(delivery.id)}
                        disabled={
                          isLocked ||
                          (isVerifyPending &&
                            verifyingDeliveryId === delivery.id)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white"
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
                      <p className="text-xs text-red-600">
                        {otpErrorByDeliveryId[delivery.id]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
