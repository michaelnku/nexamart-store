"use client";

import { useTransition } from "react";
import {
  AlertCircle,
  FileWarning,
  Link2,
  LoaderCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { parseModerationReportSearchParams } from "@/lib/moderation/reportsQuery";
import type {
  getUserReportOverview,
  getUserReports,
} from "@/lib/moderation/getUserReports";
import { formatModerationNumber } from "@/lib/moderation/formatters";
import { ReportFilters } from "./ReportFilters";
import { ReportsTable } from "./ReportsTable";

type ReportsResult = Awaited<ReturnType<typeof getUserReports>>;
type ReportsOverview = Awaited<ReturnType<typeof getUserReportOverview>>;
type ReportFiltersType = ReturnType<typeof parseModerationReportSearchParams>;

const PAGE_SIZE = 24;

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
};

function buildReportsPageHref(filters: ReportFiltersType, page: number) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.reason && filters.reason !== "ALL") {
    params.set("reason", filters.reason);
  }

  if (filters.targetType && filters.targetType !== "ALL") {
    params.set("targetType", filters.targetType);
  }

  const query = params.toString();
  return query
    ? `/marketplace/dashboard/moderator/reports?${query}`
    : "/marketplace/dashboard/moderator/reports";
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4];
  }

  if (page >= totalPages - 2) {
    return [totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [page - 1, page, page + 1];
}

function MetricCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: typeof AlertCircle;
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
            {formatModerationNumber(value)}
          </h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 p-3 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function ModeratorReportsContent(props: {
  data: {
    reports: ReportsResult;
    overview: ReportsOverview;
  };
  filters: ReportFiltersType;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const visiblePages = getVisiblePages(
    props.data.reports.pagination.page,
    props.data.reports.pagination.totalPages,
  );
  const pageStart =
    props.data.reports.pagination.totalItems === 0
      ? 0
      : (props.data.reports.pagination.page - 1) * PAGE_SIZE + 1;
  const pageEnd =
    props.data.reports.pagination.totalItems === 0
      ? 0
      : Math.min(
          props.data.reports.pagination.page * PAGE_SIZE,
          props.data.reports.pagination.totalItems,
        );

  const navigate = (href: string) => {
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Open Reports"
          value={props.data.overview.openCount}
          accent="text-[var(--brand-blue)]"
          icon={AlertCircle}
        />
        <MetricCard
          label="Under Review"
          value={props.data.overview.underReviewCount}
          accent="text-amber-600"
          icon={FileWarning}
        />
        <MetricCard
          label="Linked Incidents"
          value={props.data.overview.linkedIncidentCount}
          accent="text-green-600"
          icon={Link2}
        />
      </div>

      <ReportFilters isPending={isPending} onNavigate={navigate} />

      <div className="relative">
        {isPending ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px] dark:bg-zinc-950/60">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Updating reports
            </div>
          </div>
        ) : null}

        <div
          aria-busy={isPending}
          className={`space-y-4 transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}
        >
          <ReportsTable reports={props.data.reports.items} />

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.2)] dark:border-zinc-800 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500 dark:text-zinc-400">
              Showing {formatModerationNumber(pageStart)}-
              {formatModerationNumber(pageEnd)} of{" "}
              {formatModerationNumber(props.data.reports.pagination.totalItems)}{" "}
              matching reports
            </div>

            <Pagination className="justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  {props.data.reports.pagination.hasPreviousPage ? (
                    <PaginationPrevious
                      href={buildReportsPageHref(
                        props.filters,
                        props.data.reports.pagination.page - 1,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildReportsPageHref(
                            props.filters,
                            props.data.reports.pagination.page - 1,
                          ),
                        );
                      }}
                    />
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-slate-300 dark:text-zinc-700">
                      Previous
                    </span>
                  )}
                </PaginationItem>

                {visiblePages[0] !== 1 ? (
                  <PaginationItem>
                    <PaginationLink
                      href={buildReportsPageHref(props.filters, 1)}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(buildReportsPageHref(props.filters, 1));
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                ) : null}

                {visiblePages[0] > 2 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}

                {visiblePages.map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href={buildReportsPageHref(props.filters, page)}
                      isActive={page === props.data.reports.pagination.page}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(buildReportsPageHref(props.filters, page));
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {visiblePages[visiblePages.length - 1] <
                props.data.reports.pagination.totalPages - 1 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}

                {visiblePages[visiblePages.length - 1] !==
                props.data.reports.pagination.totalPages ? (
                  <PaginationItem>
                    <PaginationLink
                      href={buildReportsPageHref(
                        props.filters,
                        props.data.reports.pagination.totalPages,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildReportsPageHref(
                            props.filters,
                            props.data.reports.pagination.totalPages,
                          ),
                        );
                      }}
                    >
                      {props.data.reports.pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                ) : null}

                <PaginationItem>
                  {props.data.reports.pagination.hasNextPage ? (
                    <PaginationNext
                      href={buildReportsPageHref(
                        props.filters,
                        props.data.reports.pagination.page + 1,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildReportsPageHref(
                            props.filters,
                            props.data.reports.pagination.page + 1,
                          ),
                        );
                      }}
                    />
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-slate-300 dark:text-zinc-700">
                      Next
                    </span>
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
