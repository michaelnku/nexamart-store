"use client";

import {
  AlertTriangle,
  BarChart3,
  Building2,
  Coins,
  DollarSign,
  Package,
  Receipt,
  RefreshCcw,
  Store,
  Truck,
  Users,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { usePlatformAnalytics } from "@/hooks/usePlatformAnalytics";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import { formatAnalyticsCount } from "@/lib/analytics/format";

type AdminPlatformAnalyticsClientProps = {
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

export default function AdminPlatformAnalyticsClient({
  initialRange,
}: AdminPlatformAnalyticsClientProps) {
  const [range, setRange] = useState(initialRange);
  const formatMoney = useFormatMoneyFromUSD();
  const query = usePlatformAnalytics(range);

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.isError || !query.data) {
    const errorMessage = "Failed to load platform analytics.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Marketplace Intelligence"
          title="Platform Analytics"
          description="Track GMV, commission flow, payout exposure, customer growth, and marketplace momentum from the same admin surface."
          accentClassName="bg-[linear-gradient(135deg,#020617_0%,#0f3d56_48%,#115e59_100%)]"
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
      title: "Total GMV",
      value: formatMoney(analytics.summary.totalGmv),
      description: "Paid marketplace order value in the selected period.",
      icon: DollarSign,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      change: analytics.changes.totalGmv,
    },
    {
      title: "Platform Revenue",
      value: formatMoney(analytics.summary.totalPlatformRevenue),
      description: "Released platform commission recognized in the period.",
      icon: Coins,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
      change: analytics.changes.totalPlatformRevenue,
    },
    {
      title: "Total Orders",
      value: formatAnalyticsCount(analytics.summary.totalOrders),
      description: "Paid marketplace orders created in the selected period.",
      icon: Receipt,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
      change: analytics.changes.totalOrders,
    },
    {
      title: "Average Order Value",
      value: formatMoney(analytics.summary.averageOrderValue),
      description: "Reliable supporting KPI derived from GMV divided by orders.",
      icon: BarChart3,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
      change: analytics.changes.averageOrderValue,
    },
    {
      title: "Total Customers",
      value: formatAnalyticsCount(analytics.summary.totalCustomers),
      description: "Customer accounts on platform as of the selected end date.",
      icon: Users,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
    },
    {
      title: "Total Sellers",
      value: formatAnalyticsCount(analytics.summary.totalSellers),
      description: "Seller accounts on platform as of the selected end date.",
      icon: Store,
      tintClassName:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    },
    {
      title: "Total Riders",
      value: formatAnalyticsCount(analytics.summary.totalRiders),
      description: "Rider accounts on platform as of the selected end date.",
      icon: Truck,
      tintClassName:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
    },
    {
      title: "Active Stores",
      value: formatAnalyticsCount(analytics.summary.activeStoresCount),
      description: "Stores currently active and not suspended.",
      icon: Building2,
      tintClassName:
        "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300",
    },
    {
      title: "Pending Payouts",
      value: formatMoney(analytics.summary.pendingPayoutsTotal),
      description: "Current unsettled seller and rider payout exposure.",
      icon: Wallet,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      title: "Completed Payouts",
      value: formatMoney(analytics.summary.completedPayoutsTotal),
      description: "Released seller and rider payouts recorded to date.",
      icon: RefreshCcw,
      tintClassName:
        "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-900/60 dark:bg-lime-950/40 dark:text-lime-300",
    },
    {
      title: "Refunds",
      value: formatMoney(analytics.summary.refundsTotal),
      description: "Successful refund transactions in the selected period.",
      icon: AlertTriangle,
      tintClassName:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
    },
  ];

  const hasNoOrders = analytics.summary.totalOrders === 0;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Marketplace Intelligence"
        title="Platform Analytics"
        description="Track GMV, commission flow, payout exposure, customer growth, and marketplace momentum from the same admin surface."
        accentClassName="bg-[linear-gradient(135deg,#020617_0%,#0f3d56_48%,#115e59_100%)]"
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

      {hasNoOrders ? (
        <PremiumPanel
          title="No Marketplace Activity Yet"
          description="Platform analytics will populate after the first paid marketplace orders and payout events land."
        >
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>No analytics data for this range</EmptyTitle>
              <EmptyDescription>
                Try a wider date range or wait for new paid orders, refunds, and
                payout releases to be recorded.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PremiumPanel>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsTrendPanel
              title="GMV Over Time"
              description="Paid order value grouped across the selected range."
              data={analytics.trends.gmv}
              dataKey="gmv"
              color="#0f766e"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Platform Revenue Over Time"
              description="Released platform commission grouped by payout recognition date."
              data={analytics.trends.platformRevenue}
              dataKey="platformRevenue"
              color="#0284c7"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Orders Over Time"
              description="Paid marketplace order count trend."
              data={analytics.trends.orders}
              dataKey="orders"
              color="#7c3aed"
              formatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsTrendPanel
              title="New Users Over Time"
              description="Customer account creation trend for the selected window."
              data={analytics.trends.newUsers}
              dataKey="newUsers"
              color="#0f172a"
              formatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsTrendPanel
              title="New Sellers Over Time"
              description="Seller account creation trend for the selected window."
              data={analytics.trends.newSellers}
              dataKey="newSellers"
              color="#c2410c"
              formatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsTrendPanel
              title="Payouts Over Time"
              description="Released seller and rider payouts grouped by payout release date."
              data={analytics.trends.payouts}
              dataKey="payouts"
              color="#ca8a04"
              formatter={formatMoney}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsBreakdownList
              title="Orders By Status"
              description="Current order outcomes for paid marketplace orders in range."
              rows={analytics.breakdowns.orderStatuses}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsBreakdownList
              title="Payment Method Breakdown"
              description="Payment mix from paid marketplace orders."
              rows={analytics.breakdowns.paymentMethods}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsBreakdownList
              title="Delivery Type Breakdown"
              description="How customers fulfilled paid orders across the marketplace."
              rows={analytics.breakdowns.deliveryTypes}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsRankedList
              title="Category Breakdown"
              description="Top categories ranked by captured order-item GMV."
              rows={analytics.breakdowns.categories}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Top Sellers"
              description="Sellers ranked by seller-group GMV in the selected period."
              rows={analytics.breakdowns.topSellers}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Top Products"
              description="Products ranked by captured order-item revenue."
              rows={analytics.breakdowns.topProducts}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} unit${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Top Customers"
              description="Customers ranked by spend across paid marketplace orders."
              rows={analytics.breakdowns.topCustomers}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
              }
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
