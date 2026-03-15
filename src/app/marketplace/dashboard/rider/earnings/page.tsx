"use client";

import { useQuery } from "@tanstack/react-query";
import { getRiderEarningsAction } from "@/actions/rider/getRiderEarningsAction";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { Skeleton } from "@/components/ui/skeleton";
import { Bike, CheckCircle2, PackageSearch, Wallet } from "lucide-react";

const styles = {
  section: "mx-auto max-w-6xl space-y-8 px-4 py-6",
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  tintedSurface:
    "rounded-xl border border-slate-200/70 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/70",
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
  token:
    "inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  tableHeader:
    "grid grid-cols-[1.1fr_1fr_1fr_0.9fr] gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400",
  rowHover:
    "border-t border-slate-200/80 transition-colors hover:bg-slate-50/70 dark:border-zinc-800 dark:hover:bg-zinc-900/50",
};

function MetricCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: typeof Wallet;
}) {
  return (
    <div className={`${styles.premiumSurface} min-w-0 p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
            {label}
          </p>
          <h2
            className={`min-w-0 break-words text-xl font-bold leading-tight tracking-tight sm:text-2xl ${accent}`}
          >
            {value}
          </h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 p-3 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function RiderEarningsSkeleton() {
  return (
    <main className={styles.section}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`${styles.premiumSurface} p-5`}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-32" />
          </div>
        ))}
      </section>

      <section className={`overflow-hidden ${styles.premiumSurface}`}>
        <div className="border-b p-4 dark:border-zinc-800">
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
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rider-earnings"],
    queryFn: async () => getRiderEarningsAction(),
  });

  if (isLoading) {
    return <RiderEarningsSkeleton />;
  }

  if (isError || !data || "error" in data) {
    return (
      <p className="py-20 text-center text-red-500 dark:text-red-400">
        Failed to load earnings
      </p>
    );
  }

  const { totalEarnings, pendingEscrow, completed, deliveries } = data;

  return (
    <main className={`${styles.section} text-slate-950 dark:text-zinc-100`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className={styles.eyebrow}>Rider Revenue</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Track your delivery earnings and payout progress.
            </p>
          </div>
        </div>

        <div className={`${styles.tintedSurface} flex items-center gap-3 px-4 py-3`}>
          <div className="rounded-xl bg-[#3c9ee0]/10 p-2 text-[#3c9ee0] dark:bg-[#3c9ee0]/15">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              Delivery Rows
            </p>
            <p className="text-lg font-semibold text-slate-950 dark:text-zinc-100">
              {deliveries.length}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total Earnings"
          value={formatMoneyFromUSD(totalEarnings)}
          accent="text-[var(--brand-blue)]"
          icon={Wallet}
        />
        <MetricCard
          label="Pending Escrow"
          value={formatMoneyFromUSD(pendingEscrow)}
          accent="text-amber-600"
          icon={Bike}
        />
        <MetricCard
          label="Completed"
          value={formatMoneyFromUSD(completed)}
          accent="text-green-600"
          icon={CheckCircle2}
        />
      </section>

      <section className={`overflow-hidden ${styles.premiumSurface}`}>
        <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(60,158,224,0.08),rgba(255,255,255,0.96))] px-6 py-4 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(60,158,224,0.12),rgba(24,24,27,0.96))]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-zinc-100">
                Delivery Earnings
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Delivery fee history and payout status across completed trips.
              </p>
            </div>
            <span className={styles.token}>Rider Ledger</span>
          </div>
        </div>

        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 p-4 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
              <PackageSearch className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                No earnings yet
              </p>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Completed delivery activity will appear here with fee and payout
                details.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden border-b border-slate-200/80 px-6 py-4 dark:border-zinc-800 lg:block">
              <div className={styles.tableHeader}>
                <span>Order</span>
                <span>Date</span>
                <span className="text-right">Delivery Fee</span>
                <span className="text-right">Status</span>
              </div>
            </div>

            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} className={styles.rowHover}>
                      <td className="p-6">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-950 dark:text-zinc-100">
                            {d.trackingNumber ?? d.orderId}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Order reference
                          </p>
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-800 dark:text-zinc-200">
                            {new Date(d.createdAt).toDateString()}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Created
                          </p>
                        </div>
                      </td>

                      <td className="p-6 text-right text-base font-bold text-[var(--brand-blue)]">
                        {formatMoneyFromUSD(d.fee)}
                      </td>

                      <td className="p-6 text-right">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
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

            <div className="space-y-4 p-4 lg:hidden">
              {deliveries.map((d) => (
                <div key={d.id} className={`${styles.tintedSurface} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-950 dark:text-zinc-100">
                        {d.trackingNumber ?? d.orderId}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {new Date(d.createdAt).toDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        d.status === "DELIVERED"
                          ? "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {d.status.toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                      Delivery Fee
                    </p>
                    <p className="text-xl font-bold tracking-tight text-[var(--brand-blue)]">
                      {formatMoneyFromUSD(d.fee)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
