"use client";

import { useQuery } from "@tanstack/react-query";
import { getSellerEarningsAction } from "@/actions/seller/getSellerEarningsAction";
import { Skeleton } from "@/components/ui/skeleton";

function SellerEarningsSkeleton() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
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
            <div key={index} className="grid gap-3 border-t pt-4 sm:grid-cols-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20 sm:justify-self-end" />
              <Skeleton className="h-5 w-20 sm:justify-self-end" />
              <Skeleton className="h-5 w-20 sm:justify-self-end" />
              <Skeleton className="h-6 w-24 rounded-full sm:justify-self-end" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function SellerEarningsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["seller-earnings"],
    queryFn: async () => getSellerEarningsAction(),
  });

  if (isLoading) {
    return <SellerEarningsSkeleton />;
  }

  if (isError || !data || "error" in data) {
    return (
      <p className="text-center text-red-500 py-20">Failed to load earnings</p>
    );
  }

  const { totalRevenue, totalEarnings, pendingEscrow, released, groups } = data;

  const formatMoney = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <p className="text-sm text-gray-500">
          Track your sales revenue and payouts.
        </p>
      </div>

      {/* Summary cards */}

      <section className="grid md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Revenue</p>
          <h2 className="text-2xl font-semibold">
            {formatMoney(totalRevenue)}
          </h2>
        </div>

        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <h2 className="text-2xl font-semibold text-[var(--brand-blue)]">
            {formatMoney(totalEarnings)}
          </h2>
        </div>

        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Pending Escrow</p>
          <h2 className="text-2xl font-semibold text-amber-600">
            {formatMoney(pendingEscrow)}
          </h2>
        </div>

        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Released</p>
          <h2 className="text-2xl font-semibold text-green-600">
            {formatMoney(released)}
          </h2>
        </div>
      </section>

      {/* Earnings table */}

      <section className="border rounded-xl overflow-hidden">
        <div className="border-b p-4 font-semibold">Order Earnings</div>

        {groups.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No earnings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Order</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Revenue</th>
                  <th className="p-3 text-right">Commission</th>
                  <th className="p-3 text-right">Earnings</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>

              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-t">
                    <td className="p-3 font-medium">
                      {g.trackingNumber ?? g.orderId}
                    </td>

                    <td className="p-3">
                      {new Date(g.createdAt).toDateString()}
                    </td>

                    <td className="p-3 text-right">{formatMoney(g.revenue)}</td>

                    <td className="p-3 text-right text-red-500">
                      -{formatMoney(g.commission)}
                    </td>

                    <td className="p-3 text-right font-semibold text-[var(--brand-blue)]">
                      {formatMoney(g.earnings)}
                    </td>

                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          g.payoutStatus === "COMPLETED"
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {g.payoutStatus.toLowerCase()}
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
