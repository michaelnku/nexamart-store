"use client";

import {
  ArrowRightLeft,
  Coins,
  CreditCard,
  DollarSign,
  HandCoins,
  Package,
  Receipt,
  RefreshCcw,
  Store,
  Wallet,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

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
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { useRevenueReports } from "@/hooks/useRevenueReports";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import { formatAnalyticsCount } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

type AdminRevenueReportsClientProps = {
  initialRange: {
    preset: AnalyticsDatePreset;
    startDate: string;
    endDate: string;
  };
};

type ReportKey =
  | "seller-payouts"
  | "rider-payouts"
  | "platform-revenue"
  | "refunds";

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
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[420px] rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-[520px] rounded-[28px]" />
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function FinanceReportTable({
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

export default function AdminRevenueReportsClient({
  initialRange,
}: AdminRevenueReportsClientProps) {
  const [range, setRange] = useState(initialRange);
  const [activeReport, setActiveReport] =
    useState<ReportKey>("seller-payouts");
  const formatMoney = useFormatMoneyFromUSD();
  const query = useRevenueReports(range);

  const reportOptions = [
    { key: "seller-payouts" as const, label: "Seller Payout Report" },
    { key: "rider-payouts" as const, label: "Rider Payout Report" },
    { key: "platform-revenue" as const, label: "Platform Revenue Report" },
    { key: "refunds" as const, label: "Refund Report" },
  ];

  const reportTable = useMemo(() => {
    if (!query.data) {
      return null;
    }

    switch (activeReport) {
      case "seller-payouts":
        return (
          <FinanceReportTable
            columns={[
              "Seller / Store",
              "Orders",
              "Seller Revenue",
              "Pending Payout",
              "Released Payout",
              "Last Payout",
            ]}
            rows={query.data.reports.sellerPayouts.map((row) => [
              <div key={`${row.key}-seller`} className="min-w-[14rem] font-medium text-slate-950 dark:text-white">
                {row.sellerLabel}
              </div>,
              formatAnalyticsCount(row.ordersCount),
              formatMoney(row.sellerRevenueInRange),
              formatMoney(row.pendingPayout),
              formatMoney(row.releasedPayout),
              formatDateTime(row.lastPayoutDate),
            ])}
            emptyTitle="No seller payout records"
            emptyDescription="Seller payout reporting will populate after paid orders move into payout-eligible and released states."
          />
        );
      case "rider-payouts":
        return (
          <FinanceReportTable
            columns={[
              "Rider",
              "Deliveries",
              "Pending Payout",
              "Released Payout",
              "Last Payout",
            ]}
            rows={query.data.reports.riderPayouts.map((row) => [
              <div key={`${row.key}-rider`} className="min-w-[14rem] font-medium text-slate-950 dark:text-white">
                {row.riderLabel}
              </div>,
              formatAnalyticsCount(row.deliveriesCount),
              formatMoney(row.pendingPayout),
              formatMoney(row.releasedPayout),
              formatDateTime(row.lastPayoutDate),
            ])}
            emptyTitle="No rider payout records"
            emptyDescription="Rider payout reporting will populate after delivery-backed orders are confirmed and payout release events start landing."
          />
        );
      case "platform-revenue":
        return (
          <FinanceReportTable
            columns={[
              "Seller / Store",
              "Orders",
              "GMV Contribution",
              "Platform Commission",
            ]}
            rows={query.data.reports.platformRevenue.map((row) => [
              <div key={`${row.key}-platform`} className="min-w-[14rem] font-medium text-slate-950 dark:text-white">
                {row.sellerLabel}
              </div>,
              formatAnalyticsCount(row.ordersCount),
              formatMoney(row.gmvContribution),
              formatMoney(row.platformCommissionContribution),
            ])}
            emptyTitle="No platform revenue contributors"
            emptyDescription="Platform commission reporting will populate after seller-group payouts are released."
          />
        );
      default:
        return (
          <FinanceReportTable
            columns={[
              "Order Reference",
              "Customer",
              "Amount",
              "Status",
              "Recorded At",
            ]}
            rows={query.data.reports.refunds.map((row) => [
              <div key={`${row.key}-order`} className="min-w-[12rem] font-medium text-slate-950 dark:text-white">
                {row.orderReference}
              </div>,
              row.customerLabel,
              formatMoney(row.amount),
              <Badge
                key={`${row.key}-status`}
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                {row.status}
              </Badge>,
              formatDateTime(row.createdAt),
            ])}
            emptyTitle="No refunds in this range"
            emptyDescription="Successful refund records will appear here once cancellations, disputes, or finance adjustments issue buyer refunds."
          />
        );
    }
  }, [activeReport, formatMoney, query.data]);

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.isError || !query.data) {
    const errorMessage = "Failed to load revenue reports.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Finance Control Center"
          title="Revenue Reports"
          description="Review GMV, recognized commission, refund impact, payout releases, and payout liabilities from a finance-grade admin reporting surface."
          accentClassName="bg-[linear-gradient(135deg,#111827_0%,#16304a_45%,#14532d_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {errorMessage}
        </div>
      </div>
    );
  }

  const reports = query.data;
  const summaryCards = [
    {
      title: "Gross Revenue",
      value: formatMoney(reports.summary.grossRevenue),
      description: "Paid order GMV created in the selected period.",
      icon: DollarSign,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      change: reports.changes.grossRevenue,
    },
    {
      title: "Platform Commission",
      value: formatMoney(reports.summary.platformCommissionRecognized),
      description: "Commission recognized when seller payouts are released.",
      icon: Coins,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
      change: reports.changes.platformCommissionRecognized,
    },
    {
      title: "Seller Payouts Released",
      value: formatMoney(reports.summary.sellerPayoutsReleased),
      description: "Seller payouts released in the selected period.",
      icon: HandCoins,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      title: "Rider Payouts Released",
      value: formatMoney(reports.summary.riderPayoutsReleased),
      description: "Rider payouts released in the selected period.",
      icon: ArrowRightLeft,
      tintClassName:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
    },
    {
      title: "Total Payouts Released",
      value: formatMoney(reports.summary.totalPayoutsReleased),
      description: "Combined seller and rider payouts released in range.",
      icon: Wallet,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
      change: reports.changes.totalPayoutsReleased,
    },
    {
      title: "Pending Seller Payouts",
      value: formatMoney(reports.summary.pendingSellerPayouts),
      description: "Delivered seller earnings still awaiting release.",
      icon: Store,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
    },
    {
      title: "Pending Rider Payouts",
      value: formatMoney(reports.summary.pendingRiderPayouts),
      description: "Delivered rider earnings still awaiting release.",
      icon: CreditCard,
      tintClassName:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    },
    {
      title: "Pending Total Liability",
      value: formatMoney(reports.summary.pendingTotalPayoutLiability),
      description: "Current payout exposure across sellers and riders.",
      icon: RefreshCcw,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      title: "Refunds",
      value: formatMoney(reports.summary.refundsInRange),
      description: "Successful refund transactions recorded in range.",
      icon: Receipt,
      tintClassName:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
      change: reports.changes.refundsInRange,
    },
    {
      title: "Net Retained Revenue",
      value: formatMoney(reports.summary.netPlatformRetainedRevenue),
      description:
        "Recognized commission minus successful refunds recorded in range.",
      icon: Package,
      tintClassName:
        "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-900/60 dark:bg-lime-950/40 dark:text-lime-300",
      change: reports.changes.netPlatformRetainedRevenue,
    },
    {
      title: "Average Order Value",
      value: formatMoney(reports.summary.averageOrderValue),
      description: "Supporting KPI derived from gross revenue divided by orders.",
      icon: DollarSign,
      tintClassName:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
      change: reports.changes.averageOrderValue,
    },
  ];

  const hasNoFinanceActivity =
    reports.summary.grossRevenue === 0 &&
    reports.summary.totalPayoutsReleased === 0 &&
    reports.summary.refundsInRange === 0 &&
    reports.summary.pendingTotalPayoutLiability === 0;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Finance Control Center"
        title="Revenue Reports"
        description="Review GMV, recognized commission, refund impact, payout releases, and payout liabilities from a finance-grade admin reporting surface."
        accentClassName="bg-[linear-gradient(135deg,#111827_0%,#16304a_45%,#14532d_100%)]"
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

      {hasNoFinanceActivity ? (
        <PremiumPanel
          title="No Finance Activity Yet"
          description="Revenue reporting will populate once paid orders, refund records, and payout releases begin landing in the marketplace ledger flow."
        >
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyTitle>No revenue data for this range</EmptyTitle>
              <EmptyDescription>
                Try a wider date range or wait for orders, payouts, and refunds
                to be recorded.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PremiumPanel>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsTrendPanel
              title="GMV Over Time"
              description="Paid order value grouped by order creation date."
              data={reports.trends.grossRevenue}
              dataKey="grossRevenue"
              color="#0f766e"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Platform Commission Over Time"
              description="Recognized platform commission grouped by payout release date."
              data={reports.trends.platformCommission}
              dataKey="platformCommission"
              color="#0284c7"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Seller Payouts Over Time"
              description="Released seller payouts grouped by payout release date."
              data={reports.trends.sellerPayouts}
              dataKey="sellerPayouts"
              color="#7c3aed"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Rider Payouts Over Time"
              description="Released rider payouts grouped by payout release date."
              data={reports.trends.riderPayouts}
              dataKey="riderPayouts"
              color="#4338ca"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Refunds Over Time"
              description="Successful refund transactions grouped by recorded date."
              data={reports.trends.refunds}
              dataKey="refunds"
              color="#c2410c"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Net Retained Revenue Over Time"
              description="Recognized commission less successful refunds by bucket."
              data={reports.trends.netRetainedRevenue}
              dataKey="netRetainedRevenue"
              color="#65a30d"
              formatter={formatMoney}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsBreakdownList
              title="Revenue By Payment Method"
              description="Paid GMV mix by payment method."
              rows={reports.breakdowns.revenueByPaymentMethod}
              valueFormatter={formatMoney}
            />
            <AnalyticsBreakdownList
              title="Revenue By Delivery Type"
              description="Paid GMV mix by delivery fulfillment choice."
              rows={reports.breakdowns.revenueByDeliveryType}
              valueFormatter={formatMoney}
            />
            <AnalyticsRankedList
              title="Top Earning Sellers"
              description="Sellers ranked by seller revenue from paid orders in range."
              rows={reports.breakdowns.topEarningSellers}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Top Platform Contributors"
              description="Sellers ranked by recognized platform commission in range."
              rows={reports.breakdowns.topPlatformContributors}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Seller Payout Exposure"
              description="Pending seller payout liability ranked by seller."
              rows={reports.breakdowns.sellerPayoutExposure}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Rider Payout Exposure"
              description="Pending rider payout liability ranked by rider."
              rows={reports.breakdowns.riderPayoutExposure}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} deliver${value === 1 ? "y" : "ies"}`
              }
            />
          </section>
        </>
      )}

      <PremiumPanel
        title="Detailed Finance Reports"
        description="Switch between seller, rider, platform, and refund reporting views for a reconciliation-ready breakdown."
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {reportOptions.map((option) => (
            <Button
              key={option.key}
              type="button"
              size="sm"
              variant={activeReport === option.key ? "default" : "outline"}
              onClick={() => setActiveReport(option.key)}
              className={cn(
                "rounded-full",
                activeReport === option.key
                  ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  : "",
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {reportTable}
      </PremiumPanel>

      {query.isFetching ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled>
            <RefreshCcw className="h-4 w-4" />
            Refreshing reports...
          </Button>
        </div>
      ) : null}
    </main>
  );
}
