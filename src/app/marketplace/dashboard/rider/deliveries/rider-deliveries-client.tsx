"use client";

import { getRiderDeliveriesAction } from "@/actions/rider/riderActions";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

const STATUS_TABS = [
  { key: "pending", label: "Pending" },
  { key: "assigned", label: "Assigned" },
  { key: "ongoing", label: "Ongoing" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]["key"];

export default function RiderDeliveriesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") ?? "assigned") as StatusKey;

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
      : { pending: 0, assigned: 0, ongoing: 0, cancelled: 0 };
  const activeKey =
    !isLoading && !isFailure ? data.activeKey : (status as StatusKey);
  const currency = "USD";

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
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
