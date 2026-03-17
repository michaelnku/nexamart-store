"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Layers3,
  PlayCircle,
  RefreshCcw,
  RotateCcw,
  TimerReset,
  Workflow,
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
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminJobsDashboard } from "@/hooks/useAdminJobsDashboard";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import { formatAnalyticsCount } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

type AdminJobsClientProps = {
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
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[24px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[360px] rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-[520px] rounded-[28px]" />
      <Skeleton className="h-[520px] rounded-[28px]" />
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

function getStatusBadgeClass(status: string) {
  if (["COMPLETED", "SUCCESS", "DONE"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (["RUNNING", "PROCESSING", "IN_PROGRESS"].includes(status)) {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300";
  }

  if (["FAILED", "DEAD"].includes(status)) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300";
  }

  if (["RETRYING"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
}

function JobsTable({
  title,
  description,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  rows: Array<{
    id: string;
    type: string;
    status: string;
    attempts: number;
    maxRetries: number;
    runAt: string;
    createdAt: string;
    lastError: string | null;
  }>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <PremiumPanel title={title} description={description}>
      {rows.length === 0 ? (
        <Empty className="border-slate-200/80 dark:border-zinc-800">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Workflow />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
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
                  "Attempts",
                  "Run At",
                  "Created",
                  "Last Error",
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm font-medium text-slate-950 dark:border-zinc-900 dark:text-white">
                    <div className="min-w-[12rem]">
                      <p>{row.type}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                        {row.id}
                      </p>
                    </div>
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 dark:border-zinc-900">
                    <Badge
                      variant="outline"
                      className={cn(getStatusBadgeClass(row.status))}
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                    {formatAnalyticsCount(row.attempts)} /{" "}
                    {formatAnalyticsCount(row.maxRetries)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                    {formatDateTime(row.runAt)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-700 dark:border-zinc-900 dark:text-zinc-200">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                    <div className="max-w-[24rem] whitespace-pre-wrap break-words">
                      {row.lastError || "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PremiumPanel>
  );
}

export default function AdminJobsClient({
  initialRange,
}: AdminJobsClientProps) {
  const [range, setRange] = useState(initialRange);
  const query = useAdminJobsDashboard(range);

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.isError || !query.data) {
    const errorMessage =
      query.error instanceof Error
        ? query.error.message
        : "Failed to load background jobs dashboard.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="System Monitoring"
          title="Background Jobs"
          description="Monitor queue health, retry pressure, overdue execution, and failure hotspots from a production-grade operations surface."
          accentClassName="bg-[linear-gradient(135deg,#111827_0%,#1e3a8a_48%,#0f766e_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {errorMessage}
        </div>
      </div>
    );
  }

  const dashboard = query.data;

  const snapshotCards = [
    {
      title: "Total Jobs",
      value: formatAnalyticsCount(dashboard.snapshot.totalJobs),
      description: "All persisted jobs in the system queue table.",
      icon: Layers3,
      tintClassName:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    },
    {
      title: "Pending Jobs",
      value: formatAnalyticsCount(dashboard.snapshot.pendingJobs),
      description: "Jobs waiting to be picked up for execution.",
      icon: Clock3,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300",
    },
    {
      title: "Running Jobs",
      value: formatAnalyticsCount(dashboard.snapshot.runningJobs),
      description: "Jobs currently marked as processing or in progress.",
      icon: PlayCircle,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
    },
    {
      title: "Completed Jobs",
      value: formatAnalyticsCount(dashboard.snapshot.completedJobs),
      description: "Jobs in a successful terminal state.",
      icon: Activity,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
    {
      title: "Failed Jobs",
      value: formatAnalyticsCount(dashboard.snapshot.failedJobs),
      description: "Jobs in failed or dead terminal states.",
      icon: AlertTriangle,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
    },
    {
      title: "Overdue Jobs",
      value: formatAnalyticsCount(dashboard.snapshot.overdueJobs),
      description: "Queued jobs whose scheduled run time has already passed.",
      icon: TimerReset,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    },
    {
      title: "Retrying Jobs",
      value: formatAnalyticsCount(dashboard.snapshot.retryingJobs),
      description: "Jobs explicitly sitting in retry state right now.",
      icon: RotateCcw,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300",
    },
  ];

  const rangeCards = [
    {
      title: "Jobs Created",
      value: formatAnalyticsCount(dashboard.rangeSummary.jobsCreated),
      description: "New jobs inserted during the selected period.",
      icon: Workflow,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
      change: dashboard.changes.jobsCreated,
    },
    {
      title: "Jobs Scheduled",
      value: formatAnalyticsCount(dashboard.rangeSummary.jobsScheduled),
      description: "Jobs whose runAt fell inside the selected period.",
      icon: Clock3,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300",
      change: dashboard.changes.jobsScheduled,
    },
    {
      title: "Failed In Range",
      value: formatAnalyticsCount(dashboard.rangeSummary.failedJobs),
      description: "Jobs created in range that are currently failed.",
      icon: AlertTriangle,
      tintClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
      change: dashboard.changes.failedJobs,
    },
    {
      title: "Retrying In Range",
      value: formatAnalyticsCount(dashboard.rangeSummary.retryingJobs),
      description: "Jobs created in range currently marked retrying.",
      icon: RotateCcw,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300",
      change: dashboard.changes.retryingJobs,
    },
  ];

  const hasNoJobs = dashboard.snapshot.totalJobs === 0;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="System Monitoring"
        title="Background Jobs"
        description="Monitor queue health, retry pressure, overdue execution, and failure hotspots from a production-grade operations surface."
        accentClassName="bg-[linear-gradient(135deg,#111827_0%,#1e3a8a_48%,#0f766e_100%)]"
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
            Live queue state across pending, running, completed, failed,
            overdue, and retrying jobs.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
            Range-based reporting for jobs created, scheduled, failed, and
            retrying.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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

      {hasNoJobs ? (
        <PremiumPanel
          title="No Background Jobs Recorded"
          description="This dashboard will populate after jobs begin entering the queue."
        >
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Workflow />
              </EmptyMedia>
              <EmptyTitle>No jobs found</EmptyTitle>
              <EmptyDescription>
                Once queue jobs are created, you will see volume, status, retry,
                and failure analytics here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PremiumPanel>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsTrendPanel
              title="Jobs Created"
              description="New jobs grouped by creation date."
              data={dashboard.trends.jobsCreated}
              dataKey="jobsCreated"
              color="#2563eb"
              formatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsTrendPanel
              title="Jobs Scheduled"
              description="Jobs grouped by scheduled run time."
              data={dashboard.trends.jobsScheduled}
              dataKey="jobsScheduled"
              color="#0891b2"
              formatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsTrendPanel
              title="Failed Jobs"
              description="Failed job counts grouped by job creation date."
              data={dashboard.trends.failedJobs}
              dataKey="failedJobs"
              color="#dc2626"
              formatter={(value) => formatAnalyticsCount(value)}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <AnalyticsBreakdownList
              title="Jobs By Status"
              description="Current queue state mix across all jobs."
              rows={dashboard.breakdowns.jobsByStatus}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsBreakdownList
              title="Jobs By Type"
              description="Most common job types created in the selected period."
              rows={dashboard.breakdowns.jobsByType}
              valueFormatter={(value) => formatAnalyticsCount(value)}
            />
            <AnalyticsRankedList
              title="Failure Hotspots"
              description="Job types with the highest failed-job concentration."
              rows={dashboard.breakdowns.failureHotspots}
              primaryFormatter={(value) =>
                `${formatAnalyticsCount(value)} failed`
              }
              secondaryLabel={(value) =>
                `${formatAnalyticsCount(value)} total attempts`
              }
            />
            <AnalyticsRankedList
              title="Retry Hotspots"
              description="Job types generating the most retry pressure."
              rows={dashboard.breakdowns.retryHotspots}
              primaryFormatter={(value) =>
                `${formatAnalyticsCount(value)} jobs`
              }
              secondaryLabel={(value) =>
                `${Number(value).toFixed(1)} avg attempts`
              }
            />
          </section>
        </>
      )}

      <section className="grid gap-6">
        <JobsTable
          title="Recent Jobs"
          description="Most recently created jobs in the system."
          rows={dashboard.tables.recentJobs}
          emptyTitle="No recent jobs"
          emptyDescription="Recently created jobs will appear here."
        />

        <JobsTable
          title="Failed Jobs"
          description="Most recent failed or dead jobs for operator review."
          rows={dashboard.tables.failedJobs}
          emptyTitle="No failed jobs"
          emptyDescription="Failed jobs will appear here when the queue encounters errors."
        />

        <JobsTable
          title="Retry Queue"
          description="Jobs that are retrying or have already retried and are still pending."
          rows={dashboard.tables.retryQueue}
          emptyTitle="No retry queue activity"
          emptyDescription="Retrying jobs will appear here when queue recovery is needed."
        />
      </section>

      {query.isFetching ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled>
            <RefreshCcw className="h-4 w-4" />
            Refreshing jobs dashboard...
          </Button>
        </div>
      ) : null}
    </main>
  );
}
