"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Gavel,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import AdminDisputeCaseDetail from "@/app/marketplace/dashboard/admin/disputes/AdminDisputeCaseDetail";
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
import DisputeReasonLabel from "@/components/disputes/DisputeReasonLabel";
import DisputeStatusBadge from "@/components/disputes/DisputeStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAdminDisputesDashboard } from "@/hooks/useAdminDisputesDashboard";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import {
  type AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import { formatAnalyticsCount } from "@/lib/analytics/format";
import { getDisputeAttentionBadgeClass } from "@/lib/disputes/admin-ui";
import { getDisputeStatusLabel } from "@/lib/disputes/ui";
import type { AdminDisputeDetailDTO } from "@/lib/types";

type AdminDisputesClientProps = {
  initialRange: {
    preset: AnalyticsDatePreset;
    startDate: string;
    endDate: string;
  };
};

type RefundFilter = "all" | "recorded" | "not-recorded";

function LoadingState() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-[28px]" />
      <Skeleton className="h-24 rounded-[24px]" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-40 rounded-full" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[24px]" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-40 rounded-full" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[24px]" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[360px] rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-[640px] rounded-[28px]" />
      <Skeleton className="h-[760px] rounded-[28px]" />
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

function getPrimarySellerLabel(dispute: AdminDisputeDetailDTO) {
  const primarySeller = dispute.sellers[0];

  if (!primarySeller) {
    return "No impacted seller";
  }

  return (
    primarySeller.storeName ??
    primarySeller.sellerName ??
    primarySeller.sellerGroupId
  );
}

export default function AdminDisputesClient({
  initialRange,
}: AdminDisputesClientProps) {
  const [range, setRange] = useState(initialRange);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [reason, setReason] = useState<string>("all");
  const [refundFilter, setRefundFilter] = useState<RefundFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formatMoney = useFormatMoneyFromUSD();
  const dashboardQuery = useAdminDisputesDashboard(range);
  const dashboard = dashboardQuery.data ?? null;

  const filteredCases = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return dashboard.cases.filter((dispute) => {
      const customerName = dispute.customer.name?.toLowerCase() ?? "";
      const customerEmail = dispute.customer.email.toLowerCase();
      const sellerText = dispute.sellers
        .map((seller) =>
          [seller.sellerName, seller.storeName, seller.sellerGroupId]
            .filter(Boolean)
            .join(" "),
        )
        .join(" ")
        .toLowerCase();
      const riderText = [dispute.delivery?.riderName, dispute.delivery?.riderEmail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const orderText = [dispute.orderId, dispute.orderTrackingNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 ||
        customerName.includes(normalizedQuery) ||
        customerEmail.includes(normalizedQuery) ||
        sellerText.includes(normalizedQuery) ||
        riderText.includes(normalizedQuery) ||
        orderText.includes(normalizedQuery);

      const matchesStatus = status === "all" ? true : dispute.status === status;
      const matchesReason = reason === "all" ? true : dispute.reason === reason;
      const matchesRefund =
        refundFilter === "all"
          ? true
          : refundFilter === "recorded"
            ? Boolean(dispute.refundRecordedAt)
            : !dispute.refundRecordedAt;

      return matchesQuery && matchesStatus && matchesReason && matchesRefund;
    });
  }, [dashboard, query, reason, refundFilter, status]);

  const selectedCase =
    filteredCases.find((dispute) => dispute.id === selectedId) ??
    filteredCases[0] ??
    null;

  if (dashboardQuery.isLoading) {
    return <LoadingState />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    const errorMessage = "Failed to load dispute management data.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Trust And Safety"
          title="Disputes Management"
          description="Monitor the live dispute queue, refund exposure, and case-resolution health from an admin trust-and-safety command center."
          accentClassName="bg-[linear-gradient(135deg,#111827_0%,#4c1d95_45%,#1d4ed8_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const snapshotCards = [
    {
      title: "Total Disputes",
      value: formatAnalyticsCount(dashboard.snapshot.totalDisputes),
      description: "All disputes recorded in the marketplace dispute system.",
      icon: Gavel,
      tintClassName:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    },
    {
      title: "Open Disputes",
      value: formatAnalyticsCount(dashboard.snapshot.openDisputes),
      description: "Current unresolved disputes across all active queue states.",
      icon: ShieldAlert,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
    },
    {
      title: "Pending Review",
      value: formatAnalyticsCount(dashboard.snapshot.pendingReviewDisputes),
      description: "Newly opened disputes still awaiting triage.",
      icon: AlertTriangle,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    },
    {
      title: "Under Review",
      value: formatAnalyticsCount(dashboard.snapshot.underReviewDisputes),
      description: "Cases currently being worked through the review flow.",
      icon: ShieldCheck,
      tintClassName:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300",
    },
    {
      title: "Waiting On Seller",
      value: formatAnalyticsCount(dashboard.snapshot.waitingForSellerDisputes),
      description: "Cases blocked on seller response or supporting evidence.",
      icon: Clock3,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300",
    },
    {
      title: "Waiting On Customer / Return",
      value: formatAnalyticsCount(
        dashboard.snapshot.waitingForCustomerOrReturnDisputes,
      ),
      description: "Cases waiting on customer action or a return workflow update.",
      icon: Wallet,
      tintClassName:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30 dark:text-fuchsia-300",
    },
  ];

  const rangeCards = [
    {
      title: "Disputes Created",
      value: formatAnalyticsCount(dashboard.rangeSummary.disputesCreated),
      description: "New disputes opened in the selected reporting period.",
      icon: Gavel,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
      change: dashboard.changes.disputesCreated,
    },
    {
      title: "Resolved Disputes",
      value: formatAnalyticsCount(dashboard.rangeSummary.resolvedDisputes),
      description: "Disputes in a resolved state updated during the selected period.",
      icon: ShieldCheck,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
      change: dashboard.changes.resolvedDisputes,
    },
    {
      title: "Rejected Disputes",
      value: formatAnalyticsCount(dashboard.rangeSummary.rejectedDisputes),
      description: "Disputes rejected during the selected reporting period.",
      icon: ShieldAlert,
      tintClassName:
        "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
      change: dashboard.changes.rejectedDisputes,
    },
    {
      title: "Refund-Recorded Cases",
      value: formatAnalyticsCount(dashboard.rangeSummary.refundRecordedDisputes),
      description: "Disputes with successful refund transactions recorded in range.",
      icon: Wallet,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300",
      change: dashboard.changes.refundRecordedDisputes,
    },
    {
      title: "Refund Amount Recorded",
      value: formatMoney(dashboard.rangeSummary.refundRecordedAmount),
      description: "Successful dispute-linked refund transactions recorded in range.",
      icon: Wallet,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
      change: dashboard.changes.refundRecordedAmount,
    },
  ];

  const hasNoDisputeData =
    dashboard.snapshot.totalDisputes === 0 &&
    dashboard.rangeSummary.disputesCreated === 0;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Trust And Safety"
        title="Disputes Management"
        description="Monitor the live dispute queue, refund exposure, and case-resolution health from an admin trust-and-safety command center."
        accentClassName="bg-[linear-gradient(135deg,#111827_0%,#4c1d95_45%,#1d4ed8_100%)]"
      />

      <AnalyticsDateRangeFilter
        preset={range.preset}
        startDate={range.startDate}
        endDate={range.endDate}
        disabled={dashboardQuery.isFetching}
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
            Live dispute workload and queue-state visibility across the marketplace.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {snapshotCards.map((card) => (
            <PremiumStatCard
              key={card.title}
              title={card.title}
              value={card.value}
              description={card.description}
              icon={card.icon}
              tintClassName={card.tintClassName}
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
            Reporting metrics tied to disputes opened, closed, and refunded in the active range.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {rangeCards.map((card) => (
            <PremiumStatCard
              key={card.title}
              title={card.title}
              value={card.value}
              description={card.description}
              icon={card.icon}
              tintClassName={card.tintClassName}
              footer={<AnalyticsChangeFooter value={card.change ?? null} />}
            />
          ))}
        </div>
      </section>

      {hasNoDisputeData ? (
        <PremiumPanel
          title="No Dispute Activity Yet"
          description="Dispute analytics and case queues will populate after customers begin opening marketplace disputes."
        >
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Gavel />
              </EmptyMedia>
              <EmptyTitle>No disputes recorded</EmptyTitle>
              <EmptyDescription>
                Try a wider date range or wait for dispute cases to be opened and processed.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PremiumPanel>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsTrendPanel
              title="Disputes Opened"
              description="Disputes grouped by case creation date."
              data={dashboard.trends.disputesCreated}
              dataKey="disputesCreated"
              color="#2563eb"
              formatter={formatAnalyticsCount}
            />
            <AnalyticsTrendPanel
              title="Resolved Cases"
              description="Resolved disputes grouped by terminal status update date."
              data={dashboard.trends.resolvedDisputes}
              dataKey="resolvedDisputes"
              color="#059669"
              formatter={formatAnalyticsCount}
            />
            <AnalyticsTrendPanel
              title="Refund-Recorded Cases"
              description="Successful dispute-linked refunds grouped by refund record date."
              data={dashboard.trends.refundRecordedDisputes}
              dataKey="refundRecordedDisputes"
              color="#be185d"
              formatter={formatAnalyticsCount}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsBreakdownList
              title="Disputes By Reason"
              description="Selected-range distribution of dispute reasons."
              rows={dashboard.breakdowns.disputesByReason}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsBreakdownList
              title="Current Status Mix"
              description="Live marketplace dispute states, including open and terminal cases."
              rows={dashboard.breakdowns.disputesByStatus}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsBreakdownList
              title="Disputes By Order Type"
              description="Selected-range split between food and non-food order disputes."
              rows={dashboard.breakdowns.disputesByOrderType}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsRankedList
              title="Repeat Dispute Stores"
              description="Stores generating the highest dispute counts in the selected range."
              rows={dashboard.breakdowns.repeatStores}
              primaryFormatter={(value) => `${formatAnalyticsCount(value)} cases`}
            />
            <AnalyticsRankedList
              title="Repeat Dispute Customers"
              description="Customers generating the highest dispute counts in the selected range."
              rows={dashboard.breakdowns.repeatCustomers}
              primaryFormatter={(value) => `${formatAnalyticsCount(value)} cases`}
            />
            <PremiumPanel
              title="Urgent Queue"
              description="Oldest unresolved cases ranked by age-based attention level."
            >
              <div className="space-y-4">
                {dashboard.urgentCases.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-zinc-400">
                    No unresolved cases are currently waiting in the queue.
                  </p>
                ) : null}
                {dashboard.urgentCases.map((dispute) => (
                  <div
                    key={dispute.id}
                    className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-950 dark:text-white">
                          {dispute.orderTrackingNumber ?? dispute.orderId}
                        </p>
                        <p className="truncate text-sm text-slate-500 dark:text-zinc-400">
                          {dispute.customer.name ?? dispute.customer.email}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                          {getPrimarySellerLabel(dispute)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getDisputeAttentionBadgeClass(dispute.attentionLevel)}
                      >
                        {dispute.attentionLevel}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
                      <span>{dispute.attentionAgeHours ?? 0}h in queue</span>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-auto px-0 text-xs text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white"
                      >
                        <Link href={`/marketplace/dashboard/admin/disputes/${dispute.id}`}>
                          Open case
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </PremiumPanel>
          </section>
        </>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <PremiumPanel
          title="Case Management Queue"
          description="Disputes created in the selected range. Filter by actor, status, reason, and refund recording state."
        >
          <div className="space-y-5">
            <div className="grid gap-3 xl:grid-cols-[1.5fr,0.8fr,0.8fr,0.9fr]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by order, customer, seller, store, or rider"
                  className="pl-9"
                />
              </div>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
                  <SelectItem value="WAITING_FOR_SELLER">Waiting for seller</SelectItem>
                  <SelectItem value="WAITING_FOR_CUSTOMER">Waiting for customer</SelectItem>
                  <SelectItem value="WAITING_FOR_RETURN">Waiting for return</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reasons</SelectItem>
                  <SelectItem value="ITEM_NOT_RECEIVED">Item not received</SelectItem>
                  <SelectItem value="ITEM_DAMAGED">Item damaged</SelectItem>
                  <SelectItem value="WRONG_ITEM">Wrong item</SelectItem>
                  <SelectItem value="NOT_AS_DESCRIBED">Not as described</SelectItem>
                  <SelectItem value="MISSING_ITEMS">Missing items</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={refundFilter}
                onValueChange={(value) => setRefundFilter(value as RefundFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Refunds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All refund states</SelectItem>
                  <SelectItem value="recorded">Refund recorded</SelectItem>
                  <SelectItem value="not-recorded">No refund recorded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredCases.length === 0 ? (
              <Empty className="border-slate-200/80 dark:border-zinc-800">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>No disputes match these filters</EmptyTitle>
                  <EmptyDescription>
                    Adjust the search or filter state to surface a different set of dispute cases.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {[
                        "Case",
                        "Customer",
                        "Seller / Store",
                        "Rider",
                        "Reason",
                        "Status",
                        "Attention",
                        "Refund",
                        "Created",
                        "Updated",
                        "",
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
                    {filteredCases.map((dispute) => (
                      <tr
                        key={dispute.id}
                        className={
                          selectedCase?.id === dispute.id
                            ? "bg-slate-50/70 dark:bg-zinc-900/50"
                            : ""
                        }
                      >
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                          <button
                            type="button"
                            onClick={() => setSelectedId(dispute.id)}
                            className="min-w-[10rem] text-left"
                          >
                            <p className="font-medium text-slate-950 dark:text-white">
                              {dispute.orderTrackingNumber ?? dispute.orderId}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {dispute.id}
                            </p>
                          </button>
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                          <div className="min-w-[11rem]">
                            <p className="font-medium text-slate-950 dark:text-white">
                              {dispute.customer.name ?? "Customer"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {dispute.customer.email}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                          <div className="min-w-[11rem]">
                            <p className="font-medium text-slate-950 dark:text-white">
                              {getPrimarySellerLabel(dispute)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {dispute.sellers.length} impacted group
                              {dispute.sellers.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                          <div className="min-w-[9rem]">
                            <p className="font-medium text-slate-950 dark:text-white">
                              {dispute.delivery?.riderName ??
                                dispute.delivery?.riderEmail ??
                                "No rider"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {dispute.delivery?.status.replaceAll("_", " ") ?? "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                          <DisputeReasonLabel reason={dispute.reason} />
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                          <DisputeStatusBadge status={dispute.status} />
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                          <Badge
                            variant="outline"
                            className={getDisputeAttentionBadgeClass(dispute.attentionLevel)}
                          >
                            {dispute.attentionLevel}
                          </Badge>
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm dark:border-zinc-900">
                          <div className="min-w-[8rem]">
                            <p className="font-medium text-slate-950 dark:text-white">
                              {dispute.refundRecordedAt
                                ? formatMoney(dispute.refundAmount ?? 0)
                                : "Pending"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {dispute.refundRecordedAt
                                ? "Recorded"
                                : "Not recorded"}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                          {formatDateTime(dispute.createdAt)}
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                          {formatDateTime(dispute.updatedAt)}
                        </td>
                        <td className="border-b border-slate-200/60 px-4 py-4 text-right text-sm dark:border-zinc-900">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/marketplace/dashboard/admin/disputes/${dispute.id}`}>
                              Open
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </PremiumPanel>

        <PremiumPanel
          title="Selected Case"
          description={
            selectedCase
              ? "Review the currently selected case and jump into the full dispute workspace if you need more context."
              : "Select a dispute row to inspect the current case."
          }
        >
          {selectedCase ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">
                      {selectedCase.orderTrackingNumber ?? selectedCase.orderId}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      {selectedCase.customer.name ?? selectedCase.customer.email}
                    </p>
                  </div>
                  <DisputeStatusBadge status={selectedCase.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={getDisputeAttentionBadgeClass(selectedCase.attentionLevel)}
                  >
                    {selectedCase.attentionLevel}
                  </Badge>
                  <Badge variant="outline">
                    {selectedCase.attentionAgeHours ?? 0}h in queue
                  </Badge>
                  <Badge variant="outline">
                    {getDisputeStatusLabel(selectedCase.status)}
                  </Badge>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href={`/marketplace/dashboard/admin/disputes/${selectedCase.id}`}>
                  Open Full Case
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <Empty className="border-slate-200/80 dark:border-zinc-800">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Gavel />
                </EmptyMedia>
                <EmptyTitle>No case selected</EmptyTitle>
                <EmptyDescription>
                  Pick a case from the queue to inspect its current state and actions.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </PremiumPanel>
      </section>

      {selectedCase ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400">
              Case Preview
            </p>
            <p className="text-sm text-slate-600 dark:text-zinc-300">
              Shared dispute detail view reused by the full case route.
            </p>
          </div>
          <AdminDisputeCaseDetail
            dispute={selectedCase}
            detailHref={`/marketplace/dashboard/admin/disputes/${selectedCase.id}`}
          />
        </section>
      ) : null}

      {dashboardQuery.isFetching ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled>
            Refreshing dispute command center...
          </Button>
        </div>
      ) : null}
    </main>
  );
}
