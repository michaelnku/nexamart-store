"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRightLeft,
  CreditCard,
  RefreshCcw,
  Search,
  Wallet,
} from "lucide-react";

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
import { AnalyticsDateRangeFilter } from "@/components/analytics/AnalyticsDateRangeFilter";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminTransactionsDashboard } from "@/hooks/useAdminTransactionsDashboard";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import { formatAnalyticsCount } from "@/lib/analytics/format";

type AdminTransactionsClientProps = {
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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[24px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-[360px] rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-[640px] rounded-[28px]" />
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function labelEnumValue(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "SUCCESS":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  }
}

export default function AdminTransactionsClient({
  initialRange,
}: AdminTransactionsClientProps) {
  const [range, setRange] = useState(initialRange);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const formatMoney = useFormatMoneyFromUSD();
  const query = useAdminTransactionsDashboard(range);
  const dashboard = query.data ?? null;

  const filteredTransactions = useMemo(() => {
    if (!dashboard) return [];

    const normalizedSearch = search.trim().toLowerCase();

    return dashboard.transactions.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        row.id.toLowerCase().includes(normalizedSearch) ||
        (row.reference ?? "").toLowerCase().includes(normalizedSearch) ||
        (row.description ?? "").toLowerCase().includes(normalizedSearch) ||
        row.userLabel.toLowerCase().includes(normalizedSearch) ||
        (row.orderTrackingNumber ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (row.orderId ?? "").toLowerCase().includes(normalizedSearch);

      const matchesType = typeFilter === "all" ? true : row.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [dashboard, search, typeFilter, statusFilter]);

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.isError || !dashboard) {
    const errorMessage =
      query.error instanceof Error
        ? query.error.message
        : "Failed to load transactions dashboard.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Finance Operations"
          title="Transactions"
          description="Audit persisted marketplace money movements across deposits, payments, refunds, payouts, withdrawals, and earnings."
          accentClassName="bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_48%,#0f766e_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {errorMessage}
        </div>
      </div>
    );
  }

  const overviewCards = [
    {
      title: "Transaction Volume",
      value: formatAnalyticsCount(dashboard.rangeSummary.transactionVolume),
      description: "Persisted transaction rows created in the selected period.",
      icon: Activity,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
      change: dashboard.changes.transactionVolume,
    },
    {
      title: "Successful Amount",
      value: formatMoney(dashboard.rangeSummary.successfulAmount),
      description:
        "Total successful transaction amount in the selected period.",
      icon: CreditCard,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      change: dashboard.changes.successfulAmount,
    },
    {
      title: "Refunds",
      value: formatMoney(dashboard.rangeSummary.refundsAmount),
      description:
        "Successful refund transaction amount in the selected period.",
      icon: ArrowRightLeft,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
      change: dashboard.changes.refundsAmount,
    },
    {
      title: "Payouts",
      value: formatMoney(dashboard.rangeSummary.payoutsAmount),
      description:
        "Successful seller and rider payout amount in the selected period.",
      icon: Wallet,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
      change: dashboard.changes.payoutsAmount,
    },
    {
      title: "Deposits",
      value: formatMoney(dashboard.rangeSummary.depositsAmount),
      description: "Successful deposit amount in the selected period.",
      icon: Wallet,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
      change: dashboard.changes.depositsAmount,
    },
    {
      title: "Withdrawals",
      value: formatMoney(dashboard.rangeSummary.withdrawalsAmount),
      description: "Successful withdrawal amount in the selected period.",
      icon: RefreshCcw,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
      change: dashboard.changes.withdrawalsAmount,
    },
  ];

  const hasNoData =
    dashboard.snapshot.totalTransactions === 0 &&
    dashboard.rangeSummary.transactionVolume === 0;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Finance Operations"
        title="Transactions"
        description="Audit persisted marketplace money movements across deposits, payments, refunds, payouts, withdrawals, and earnings."
        accentClassName="bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_48%,#0f766e_100%)]"
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

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {overviewCards.map((item) => (
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
      </section>

      {hasNoData ? (
        <PremiumPanel
          title="No Transaction Activity Yet"
          description="Recorded marketplace transaction data will appear here once deposits, payments, refunds, payouts, or withdrawals are persisted."
        >
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyTitle>No transactions recorded</EmptyTitle>
              <EmptyDescription>
                Try a wider date range or wait for recorded finance activity.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PremiumPanel>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsTrendPanel
              title="Transaction Count"
              description="Transaction rows created across the selected period."
              data={dashboard.trends.transactionCount}
              dataKey="transactionCount"
              color="#2563eb"
              formatter={formatAnalyticsCount}
            />
            <AnalyticsTrendPanel
              title="Successful Amount"
              description="Successful transaction amount grouped by date."
              data={dashboard.trends.successfulAmount}
              dataKey="successfulAmount"
              color="#059669"
              formatter={formatMoney}
            />
            <AnalyticsTrendPanel
              title="Refund Amount"
              description="Successful refund amount grouped by date."
              data={dashboard.trends.refundsAmount}
              dataKey="refundsAmount"
              color="#be123c"
              formatter={formatMoney}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsBreakdownList
              title="Transactions By Type"
              description="Distribution of transaction types in the selected period."
              rows={dashboard.breakdowns.byType}
              valueFormatter={formatAnalyticsCount}
            />
            <AnalyticsBreakdownList
              title="Transactions By Status"
              description="Distribution of transaction statuses in the selected period."
              rows={dashboard.breakdowns.byStatus}
              valueFormatter={formatAnalyticsCount}
            />
            <AnalyticsRankedList
              title="Top Users By Amount"
              description="Users linked to the highest transaction amount in the selected period."
              rows={dashboard.breakdowns.topUsersByAmount}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} transaction${value === 1 ? "" : "s"}`
              }
            />
            <AnalyticsRankedList
              title="Top Orders By Amount"
              description="Orders linked to the highest transaction amount in the selected period."
              rows={dashboard.breakdowns.topOrdersByAmount}
              primaryFormatter={formatMoney}
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} transaction${value === 1 ? "" : "s"}`
              }
            />
          </section>
        </>
      )}

      <PremiumPanel
        title="Transaction Ledger"
        description="Search and review persisted transaction records without mixing in escrow-only rows."
      >
        <div className="space-y-5">
          <div className="grid gap-3 xl:grid-cols-[1.5fr,0.9fr,0.9fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by reference, user, order, description, or id"
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="ORDER_PAYMENT">Order Payment</SelectItem>
                <SelectItem value="SELLER_PAYOUT">Seller Payout</SelectItem>
                <SelectItem value="RIDER_PAYOUT">Rider Payout</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                <SelectItem value="EARNING">Earning</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTransactions.length === 0 ? (
            <Empty className="border-slate-200/80 dark:border-zinc-800">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>No transactions match these filters</EmptyTitle>
                <EmptyDescription>
                  Adjust the search or filter state to surface more ledger
                  records.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    {[
                      "Type",
                      "Status",
                      "Amount",
                      "User",
                      "Role",
                      "Order",
                      "Reference",
                      "Description",
                      "Created",
                    ].map((column) => (
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
                  {filteredTransactions.map((row) => (
                    <tr key={row.id}>
                      <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                        <Badge variant="outline">
                          {labelEnumValue(row.type)}
                        </Badge>
                      </td>
                      <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                        <Badge
                          variant="outline"
                          className={getStatusBadgeClass(row.status)}
                        >
                          {labelEnumValue(row.status)}
                        </Badge>
                      </td>
                      <td className="border-b border-slate-200/60 px-4 py-4 font-medium text-slate-950 dark:border-zinc-900 dark:text-white">
                        {formatMoney(row.amount)}
                      </td>
                      <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                        <div className="min-w-[12rem]">
                          <p className="font-medium">{row.userLabel}</p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {row.userId ?? "No user id"}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                        {row.userRole ?? "—"}
                      </td>
                      <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                        <div className="min-w-[10rem]">
                          <p>{row.orderTrackingNumber ?? "No tracking"}</p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {row.orderId ?? "No order"}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                        <div className="min-w-[12rem] break-all">
                          {row.reference ?? "—"}
                        </div>
                      </td>
                      <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                        <div className="min-w-[14rem]">
                          {row.description ?? "—"}
                        </div>
                      </td>
                      <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                        {formatDateTime(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PremiumPanel>
    </main>
  );
}
