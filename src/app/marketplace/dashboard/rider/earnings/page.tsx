"use client";

import { useQuery } from "@tanstack/react-query";
import { getRiderEarningsAction } from "@/actions/rider/getRiderEarningsAction";
import { Skeleton } from "@/components/ui/skeleton";

function RiderEarningsSkeleton() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-32" />
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-4 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-3 border-t pt-4 sm:grid-cols-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-24 sm:justify-self-end" />
              <Skeleton className="h-6 w-24 rounded-full sm:justify-self-end" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function RiderEarningsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rider-earnings"],
    queryFn: async () => getRiderEarningsAction(),
  });

  if (isLoading) {
    return <RiderEarningsSkeleton />;
  }

  if (isError || !data || "error" in data) {
    return (
      <p className="text-center text-red-500 py-20">Failed to load earnings</p>
    );
  }

  const { totalEarnings, pendingEscrow, completed, deliveries } = data;

  const formatMoney = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 text-slate-950 dark:text-zinc-100">
      <div>
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Track your delivery earnings and payouts.
        </p>
      </div>

      {/* Summary cards */}

      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-5 dark:border-zinc-800 dark:bg-neutral-950">
          <p className="text-sm text-gray-500 dark:text-zinc-400">Total Earnings</p>
          <h2 className="text-2xl font-semibold text-[var(--brand-blue)]">
            {formatMoney(totalEarnings)}
          </h2>
        </div>

        <div className="rounded-xl border p-5 dark:border-zinc-800 dark:bg-neutral-950">
          <p className="text-sm text-gray-500 dark:text-zinc-400">Pending Escrow</p>
          <h2 className="text-2xl font-semibold text-amber-600">
            {formatMoney(pendingEscrow)}
          </h2>
        </div>

        <div className="rounded-xl border p-5 dark:border-zinc-800 dark:bg-neutral-950">
          <p className="text-sm text-gray-500 dark:text-zinc-400">Completed</p>
          <h2 className="text-2xl font-semibold text-green-600">
            {formatMoney(completed)}
          </h2>
        </div>
      </section>

      {/* Delivery earnings table */}

      <section className="overflow-hidden rounded-xl border dark:border-zinc-800 dark:bg-neutral-950">
        <div className="border-b p-4 font-semibold dark:border-zinc-800">Delivery Earnings</div>

        {deliveries.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-zinc-400">No earnings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-900">
                <tr>
                  <th className="p-3 text-left">Order</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Delivery Fee</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>

              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-t dark:border-zinc-800">
                    <td className="p-3 font-medium">
                      {d.trackingNumber ?? d.orderId}
                    </td>

                    <td className="p-3">
                      {new Date(d.createdAt).toDateString()}
                    </td>

                    <td className="p-3 text-right font-semibold text-[var(--brand-blue)]">
                      {formatMoney(d.fee)}
                    </td>

                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          d.status === "DELIVERED"
                            ? "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {d.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
