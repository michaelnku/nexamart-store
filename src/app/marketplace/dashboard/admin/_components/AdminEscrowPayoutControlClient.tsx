"use client";

import {
  ArrowRightLeft,
  Coins,
  HandCoins,
  PackageCheck,
  Receipt,
  RefreshCcw,
  ShieldAlert,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { AnalyticsDateRangeFilter } from "@/components/analytics/AnalyticsDateRangeFilter";
import {
  DashboardHero,
  PremiumPanel,
  PremiumStatCard,
} from "@/app/marketplace/_components/PremiumDashboard";
import {
  AnalyticsBreakdownList,
  AnalyticsChangeFooter,
  AnalyticsRankedList,
  AnalyticsTrendPanel,
} from "@/app/marketplace/dashboard/admin/_components/AdminAnalyticsPanels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useEscrowPayoutControl } from "@/hooks/useEscrowPayoutControl";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import {
  formatAnalyticsCount,
  formatAnalyticsDecimal,
} from "@/lib/analytics/format";

type AdminEscrowPayoutControlClientProps = {
  initialRange: {
    preset: AnalyticsDatePreset;
    startDate: string;
    endDate: string;
  };
};

function LoadingState() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-[28px]" />
      <Skeleton className="h-24 rounded-[24px]" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[24px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-[420px] rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-[540px] rounded-[28px]" />
      <Skeleton className="h-[540px] rounded-[28px]" />
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function ControlTable({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  columns: string[];
  rows: ReactNode[][];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return (
      <Empty className="border-slate-200/80 dark:border-zinc-800">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Receipt />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-zinc-800 dark:text-zinc-400"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminEscrowPayoutControlClient({
  initialRange,
}: AdminEscrowPayoutControlClientProps) {
  const [range, setRange] = useState(initialRange);
  const formatMoney = useFormatMoneyFromUSD();
  const query = useEscrowPayoutControl(range);

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.isError || !query.data) {
    const errorMessage =
      query.error instanceof Error
        ? query.error.message
        : "Failed to load escrow and payout control data.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Escrow Control Center"
          title="Escrow & Payouts"
          description="Track pending payout liability, released settlements, escrow-held commission, and payout queues from a marketplace finance-operations control surface."
          accentClassName="bg-[linear-gradient(135deg,#111827_0%,#1d3557_45%,#115e59_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {errorMessage}
        </div>
      </div>
    );
  }

  const control = query.data;
  const snapshotCards = [
    {
      title: "Pending Total Liability",
      value: formatMoney(control.snapshot.totalPendingPayoutLiability),
      description: "Current seller and rider payout exposure still awaiting release.",
      icon: Wallet,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      title: "Pending Seller Payouts",
      value: formatMoney(control.snapshot.pendingSellerPayouts),
      description: "Delivered seller earnings that are not yet released.",
      icon: Store,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
    },
    {
      title: "Pending Rider Payouts",
      value: formatMoney(control.snapshot.pendingRiderPayouts),
      description: "Delivered rider earnings that are not yet released.",
      icon: Truck,
      tintClassName:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    },
    {
      title: "Held Platform Commission",
      value: formatMoney(control.snapshot.escrowHeldCommission),
      description: "Platform commission still sitting in HELD escrow state.",
      icon: Coins,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      title: "Orders Awaiting Release",
      value: formatAnalyticsCount(control.snapshot.ordersAwaitingPayoutRelease),
      description: "Paid delivered/disputed orders whose payout release is not complete.",
      icon: PackageCheck,
      tintClassName:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
    },
    {
      title: "Deliveries Awaiting Release",
      value: formatAnalyticsCount(control.snapshot.deliveriesAwaitingPayoutRelease),
      description: "Delivered rider payouts still waiting to release.",
      icon: ShieldAlert,
      tintClassName:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    },
    {
      title: "Sellers With Pending Payouts",
      value: formatAnalyticsCount(control.snapshot.sellersWithPendingPayouts),
      description: "Distinct sellers currently carrying pending payout exposure.",
      icon: Store,
      tintClassName:
        "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300",
    },
    {
      title: "Riders With Pending Payouts",
      value: formatAnalyticsCount(control.snapshot.ridersWithPendingPayouts),
      description: "Distinct riders currently carrying pending payout exposure.",
      icon: Truck,
      tintClassName:
        "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-900/60 dark:bg-lime-950/40 dark:text-lime-300",
    },
  ];

  const rangeCards = [
    {
      title: "Released Seller Payouts",
      value: formatMoney(control.rangeSummary.releasedSellerPayouts),
      description: "Seller payouts released in the selected period.",
      icon: HandCoins,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
      change: control.changes.releasedSellerPayouts,
    },
    {
      title: "Released Rider Payouts",
      value: formatMoney(control.rangeSummary.releasedRiderPayouts),
      description: "Rider payouts released in the selected period.",
      icon: ArrowRightLeft,
      tintClassName:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
      change: control.changes.releasedRiderPayouts,
    },
    {
      title: "Total Released Payouts",
      value: formatMoney(control.rangeSummary.totalReleasedPayouts),
      description: "Combined seller and rider payouts released in the selected period.",
      icon: RefreshCcw,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
      change: control.changes.totalReleasedPayouts,
    },
  ];

  const hasNoPayoutActivity =
    control.snapshot.totalPendingPayoutLiability === 0 &&
    control.rangeSummary.totalReleasedPayouts === 0 &&
    control.snapshot.escrowHeldCommission === 0;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Escrow Control Center"
        title="Escrow & Payouts"
        description="Track pending payout liability, released settlements, escrow-held commission, and payout queues from a marketplace finance-operations control surface."
        accentClassName="bg-[linear-gradient(135deg,#111827_0%,#1d3557_45%,#115e59_100%)]"
      />

      <AnalyticsDateRangeFilter
        preset={range.preset}
        startDate={range.startDate}
        endDate={range.endDate}
        disabled={query.isFetching}
        onPresetChange={(preset) =>
          setRange((currentRange) => applyAnalyticsPreset(currentRange, preset))
        }
        onCustomRangeApply={({ startDate, endDate }) =>
          setRange({
            preset: "custom",
            startDate,
            endDate,
          })
        }
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400">
            Current Snapshot
          </p>
          <p className="text-sm text-slate-600 dark:text-zinc-300">
            Live escrow exposure and payout queue state from the current operational ledger and payout records.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {snapshotCards.map((item) => (
            <PremiumStatCard
              key={item.title}
              title={item.title}
              value={item.value}
              description={item.description}
              icon={item.icon}
              tintClassName={item.tintClassName}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400">
            Selected Period
          </p>
          <p className="text-sm text-slate-600 dark:text-zinc-300">
            Released payout totals for the active reporting window, compared with the prior period.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rangeCards.map((item) => (
            <PremiumStatCard
              key={item.title}
              title={item.title}
              value={item.value}
              description={item.description}
              icon={item.icon}
              tintClassName={item.tintClassName}
              footer={<AnalyticsChangeFooter value={item.change ?? null} />}
            />
          ))}
        </div>
      </section>

      {hasNoPayoutActivity ? (
        <PremiumPanel
          title="No Escrow Or Payout Activity Yet"
          description="Escrow and payout control data will populate after orders enter held escrow and payout release flows."
        >
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyTitle>No escrow data for this range</EmptyTitle>
              <EmptyDescription>
                Try a wider date range or wait for held escrow entries and payout
                releases to be recorded.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PremiumPanel>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsTrendPanel
              title="Released Seller Payouts"
              description="Seller payout releases grouped by payout release date."
              data={control.trends.releasedSellerPayouts}
              dataKey="releasedSellerPayouts"
              color="#7c3aed"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Released Rider Payouts"
              description="Rider payout releases grouped by payout release date."
              data={control.trends.releasedRiderPayouts}
              dataKey="releasedRiderPayouts"
              color="#4338ca"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Total Released Payouts"
              description="Combined seller and rider payout releases by bucket."
              data={control.trends.totalReleasedPayouts}
              dataKey="totalReleasedPayouts"
              color="#ca8a04"
              formatter={formatMoney}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsBreakdownList
              title="Payout Operational States"
              description="Combined operational view: seller payout statuses plus rider pending/completed counts. These are not sourced from a single shared enum."
              rows={control.breakdowns.payoutsByStatus}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsRankedList
              title="Seller Payout Exposure"
              description="Largest pending seller payout concentrations."
              rows={control.breakdowns.sellerPayoutExposure}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Rider Payout Exposure"
              description="Largest pending rider payout concentrations."
              rows={control.breakdowns.riderPayoutExposure}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} deliver${value === 1 ? "y" : "ies"}`
              }
            />
            <AnalyticsRankedList
              title="Top Sellers By Released Payout"
              description="Sellers ranked by released payout value in range."
              rows={control.breakdowns.topSellersByReleasedPayout}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Top Riders By Released Payout"
              description="Riders ranked by released payout value in range."
              rows={control.breakdowns.topRidersByReleasedPayout}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} deliver${value === 1 ? "y" : "ies"}`
              }
            />
            <AnalyticsRankedList
              title="Longest Waiting Exposure"
              description="Sellers and riders carrying the oldest pending payout delays."
              rows={[
                ...control.breakdowns.longestWaitingSellers.slice(0, 4).map((row) => ({
                  ...row,
                  key: `seller-${row.key}`,
                  label: `Seller: ${row.label}`,
                })),
                ...control.breakdowns.longestWaitingRiders.slice(0, 4).map((row) => ({
                  ...row,
                  key: `rider-${row.key}`,
                  label: `Rider: ${row.label}`,
                })),
              ]}
              primaryFormatter={(value) =>
                `${formatAnalyticsDecimal(value, 1)}d`
              }
              secondaryLabel={(value) => formatMoney(value)}
            />
          </section>
        </>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <PremiumPanel
          title="Seller Payout Queue"
          description="Operational view of sellers still waiting for payout release."
        >
          <ControlTable
            columns={[
              "Seller / Store",
              "Orders Awaiting",
              "Pending Amount",
              "Released Amount",
              "Last Release",
              "Status Summary",
            ]}
            rows={control.tables.sellerPayoutQueue.map((row) => [
              <div key={`${row.key}-seller`} className="min-w-[14rem] font-medium text-slate-950 dark:text-white">
                {row.sellerLabel}
              </div>,
              formatAnalyticsCount(row.awaitingOrdersCount),
              formatMoney(row.pendingAmount),
              formatMoney(row.releasedAmount),
              formatDateTime(row.lastReleaseDate),
              row.payoutStatusSummary,
            ])}
            emptyTitle="No seller payout queue"
            emptyDescription="Seller payout queue rows will appear once delivered seller earnings are waiting for release."
          />
        </PremiumPanel>

        <PremiumPanel
          title="Rider Payout Queue"
          description="Operational view of riders still waiting for payout release."
        >
          <ControlTable
            columns={[
              "Rider",
              "Deliveries Awaiting",
              "Pending Amount",
              "Released Amount",
              "Last Release",
            ]}
            rows={control.tables.riderPayoutQueue.map((row) => [
              <div key={`${row.key}-rider`} className="min-w-[14rem] font-medium text-slate-950 dark:text-white">
                {row.riderLabel}
              </div>,
              formatAnalyticsCount(row.awaitingDeliveriesCount),
              formatMoney(row.pendingAmount),
              formatMoney(row.releasedAmount),
              formatDateTime(row.lastReleaseDate),
            ])}
            emptyTitle="No rider payout queue"
            emptyDescription="Rider payout queue rows will appear once delivered rider earnings are waiting for release."
          />
        </PremiumPanel>

        <PremiumPanel
          title="Released Payout History"
          description="Recent payout releases across sellers and riders."
        >
          <ControlTable
            columns={[
              "Entity Type",
              "Entity",
              "Amount",
              "Source Reference",
              "Released At",
            ]}
            rows={control.tables.releasedPayoutHistory.map((row) => [
              <Badge
                key={`${row.key}-type`}
                variant="outline"
                className={
                  row.entityType === "SELLER"
                    ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300"
                    : "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300"
                }
              >
                {row.entityType}
              </Badge>,
              <div key={`${row.key}-label`} className="min-w-[12rem] font-medium text-slate-950 dark:text-white">
                {row.entityLabel}
              </div>,
              formatMoney(row.amount),
              row.sourceReference,
              formatDateTime(row.releasedAt),
            ])}
            emptyTitle="No released payout history"
            emptyDescription="Released payout history will appear once payout release jobs begin settling seller groups and delivery payouts."
          />
        </PremiumPanel>

        <PremiumPanel
          title="Escrow Exposure Summary"
          description="Held escrow grouped by real escrow ledger role and entry type."
        >
          <ControlTable
            columns={["Exposure Bucket", "Held Amount", "Entries", "Last Activity"]}
            rows={control.tables.escrowExposureSummary.map((row) => [
              <div key={`${row.key}-label`} className="min-w-[14rem] font-medium text-slate-950 dark:text-white">
                {row.label}
              </div>,
              formatMoney(row.heldAmount),
              formatAnalyticsCount(row.entriesCount),
              formatDateTime(row.lastActivityAt),
            ])}
            emptyTitle="No held escrow exposure"
            emptyDescription="Held escrow exposure rows will appear once escrow entries move into the HELD state."
          />
        </PremiumPanel>
      </section>

      {query.isFetching ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled>
            <RefreshCcw className="h-4 w-4" />
            Refreshing control data...
          </Button>
        </div>
      ) : null}
    </main>
  );
}
