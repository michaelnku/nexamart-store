"use client";

import {
  Activity,
  AlertTriangle,
  Bike,
  Clock3,
  Package,
  RefreshCcw,
  Route,
  Timer,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { useState } from "react";

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { useOperationsAnalytics } from "@/hooks/useOperationsAnalytics";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import {
  formatAnalyticsCount,
  formatAnalyticsDecimal,
} from "@/lib/analytics/format";

type AdminOperationsAnalyticsClientProps = {
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
        <Skeleton className="h-[420px] rounded-[28px]" />
        <Skeleton className="h-[420px] rounded-[28px]" />
      </div>
    </div>
  );
}

function formatHours(value: number) {
  return `${formatAnalyticsDecimal(value, value >= 10 ? 1 : 2)}h`;
}

function formatDeliveryCountLabel(value: number) {
  return `${formatAnalyticsCount(value)} deliver${value === 1 ? "y" : "ies"}`;
}

export default function AdminOperationsAnalyticsClient({
  initialRange,
}: AdminOperationsAnalyticsClientProps) {
  const [range, setRange] = useState(initialRange);
  const formatMoney = useFormatMoneyFromUSD();
  const query = useOperationsAnalytics(range);

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.isError || !query.data) {
    const errorMessage = "Failed to load operations analytics.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Operations Intelligence"
          title="Operations Analytics"
          description="Monitor rider throughput, dispatch speed, delivery completion, and payout exposure from a logistics-focused admin surface."
          accentClassName="bg-[linear-gradient(135deg,#111827_0%,#12335a_45%,#0f766e_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {errorMessage}
        </div>
      </div>
    );
  }

  const analytics = query.data;
  const summaryCards = [
    {
      title: "Total Deliveries",
      value: formatAnalyticsCount(analytics.summary.totalDeliveries),
      description: "Delivery-backed orders created in the selected period.",
      icon: Truck,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
      change: analytics.changes.totalDeliveries,
    },
    {
      title: "Completed Deliveries",
      value: formatAnalyticsCount(analytics.summary.completedDeliveries),
      description: "Deliveries confirmed in the selected period.",
      icon: Activity,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      change: analytics.changes.completedDeliveries,
    },
    {
      title: "Pending Assignment",
      value: formatAnalyticsCount(
        analytics.summary.pendingAssignmentDeliveries,
      ),
      description: "Open deliveries still waiting for a rider as of range end.",
      icon: Timer,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      title: "In Progress",
      value: formatAnalyticsCount(analytics.summary.inProgressDeliveries),
      description: "Assigned or picked-up deliveries still in execution.",
      icon: Route,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      title: "Cancelled Deliveries",
      value: formatAnalyticsCount(analytics.summary.cancelledDeliveries),
      description: "Cancelled delivery records as of the selected end date.",
      icon: AlertTriangle,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      title: "Assignments Created",
      value: formatAnalyticsCount(analytics.summary.assignedDeliveries),
      description: "Deliveries assigned to riders during the selected period.",
      icon: Bike,
      tintClassName:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
      change: analytics.changes.assignedDeliveries,
    },
    {
      title: "Unassigned Deliveries",
      value: formatAnalyticsCount(analytics.summary.unassignedDeliveries),
      description: "Pending dispatch records with no rider assigned.",
      icon: Package,
      tintClassName:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
    },
    {
      title: "Active Riders",
      value: formatAnalyticsCount(analytics.summary.activeRiders),
      description:
        "Distinct riders with assignment or delivery activity in range.",
      icon: UserRound,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
      change: analytics.changes.activeRiders,
    },
    {
      title: "Riders With Pending Payouts",
      value: formatAnalyticsCount(analytics.summary.ridersWithPendingPayouts),
      description: "Distinct riders with delivered, unreleased payout balances.",
      icon: Wallet,
      tintClassName:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    },
    {
      title: "Rider Payouts Released",
      value: formatMoney(analytics.summary.riderPayoutsReleased),
      description: "Released rider payout value recognized in the period.",
      icon: RefreshCcw,
      tintClassName:
        "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-900/60 dark:bg-lime-950/40 dark:text-lime-300",
      change: analytics.changes.riderPayoutsReleased,
    },
    {
      title: "Avg Completion Time",
      value: formatHours(analytics.summary.averageCompletionHours),
      description:
        "Average rider execution time from assignment to delivery.",
      icon: Clock3,
      tintClassName:
        "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300",
      change: analytics.changes.averageCompletionHours,
    },
    {
      title: "Avg Order-to-Assignment",
      value: formatHours(analytics.summary.averageAssignmentHours),
      description:
        "Average time from order creation to rider assignment in range.",
      icon: Timer,
      tintClassName:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    },
  ];

  const hasNoDeliveries =
    analytics.summary.totalDeliveries === 0 &&
    analytics.summary.completedDeliveries === 0;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Operations Intelligence"
        title="Operations Analytics"
        description="Monitor rider throughput, dispatch speed, delivery completion, and payout exposure from a logistics-focused admin surface."
        accentClassName="bg-[linear-gradient(135deg,#111827_0%,#12335a_45%,#0f766e_100%)]"
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

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <PremiumStatCard
            key={item.title}
            title={item.title}
            value={item.value}
            description={item.description}
            icon={item.icon}
            tintClassName={item.tintClassName}
            footer={
              "change" in item ? (
                <AnalyticsChangeFooter value={item.change ?? null} />
              ) : undefined
            }
          />
        ))}
      </section>

      {hasNoDeliveries ? (
        <PremiumPanel
          title="No Operations Activity Yet"
          description="Operations analytics will populate once delivery-backed orders start moving through assignment, fulfillment, and payout release."
        >
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Truck />
              </EmptyMedia>
              <EmptyTitle>No operations data for this range</EmptyTitle>
              <EmptyDescription>
                Try a wider date range or wait for rider assignments, completed
                deliveries, and payout releases to be recorded.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PremiumPanel>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsTrendPanel
              title="Deliveries Over Time"
              description="Delivery-backed orders grouped by order creation date."
              data={analytics.trends.deliveries}
              dataKey="deliveries"
              color="#0284c7"
              formatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsTrendPanel
              title="Completed Deliveries Over Time"
              description="Confirmed delivery completions grouped by delivered date."
              data={analytics.trends.completedDeliveries}
              dataKey="completedDeliveries"
              color="#059669"
              formatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsTrendPanel
              title="Rider Payouts Over Time"
              description="Released rider payouts grouped by payout release date."
              data={analytics.trends.riderPayouts}
              dataKey="riderPayouts"
              color="#65a30d"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="New Riders Over Time"
              description="Rider account registrations in the selected window."
              data={analytics.trends.newRiders}
              dataKey="newRiders"
              color="#0f172a"
              formatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsTrendPanel
              title="Completion Time Trend"
              description="Average assignment-to-delivery time grouped by delivery completion date."
              data={analytics.trends.completionHours}
              dataKey="completionHours"
              color="#0f766e"
              formatter={formatHours}
            />
            <AnalyticsTrendPanel
              title="Assignments Over Time"
              description="Deliveries grouped by rider assignment timestamp."
              data={analytics.trends.assignments}
              dataKey="assignments"
              color="#7c3aed"
              formatter={(value) => formatAnalyticsCount(value)}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsBreakdownList
              title="Deliveries By Status"
              description="Current delivery states for delivery-backed orders created in range."
              rows={analytics.breakdowns.deliveryStatuses}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsBreakdownList
              title="Delivery Type Breakdown"
              description="Delivery fulfillment mix for delivery-backed orders."
              rows={analytics.breakdowns.deliveryTypes}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsBreakdownList
              title="Assigned vs Unassigned"
              description="Delivery records with or without rider assignment as of the selected end date."
              rows={analytics.breakdowns.assignmentStates}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsRankedList
              title="Top Riders By Completed Deliveries"
              description="Riders ranked by delivered order count in the selected period."
              rows={analytics.breakdowns.topRidersByCompleted}
              primaryFormatter={(value) => formatAnalyticsCount(value)}
              secondaryLabel={(value) => `${formatMoney(value)} payout basis`}
            />
            <AnalyticsRankedList
              title="Top Riders By Released Payouts"
              description="Riders ranked by payout value released in the selected period."
              rows={analytics.breakdowns.topRidersByPayouts}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} payout${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Highest Pending Payout Exposure"
              description="Delivered rider earnings still awaiting release."
              rows={analytics.breakdowns.topRidersByPendingExposure}
              primaryFormatter={formatMoney}
              secondaryLabel={formatDeliveryCountLabel}
            />
          </section>
        </>
      )}

      {query.isFetching ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled>
            <RefreshCcw className="h-4 w-4" />
            Refreshing analytics...
          </Button>
        </div>
      ) : null}
    </main>
  );
}
