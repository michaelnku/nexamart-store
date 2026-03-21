"use client";

import { useTransition } from "react";
import {
  AlertTriangle,
  LoaderCircle,
  ShieldAlert,
  Siren,
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
import type { parseModerationIncidentSearchParams } from "@/lib/moderation/query";
import type {
  getModerationIncidentOverview,
  getModerationIncidents,
} from "@/lib/moderation/getModerationIncidents";
import { formatModerationNumber } from "@/lib/moderation/formatters";
import { IncidentFilters } from "./IncidentFilters";
import { IncidentsTable } from "./IncidentsTable";

type IncidentsResult = Awaited<ReturnType<typeof getModerationIncidents>>;
type IncidentsOverview = Awaited<
  ReturnType<typeof getModerationIncidentOverview>
>;
type IncidentFiltersType = ReturnType<typeof parseModerationIncidentSearchParams>;

const PAGE_SIZE = 24;

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
};

function buildIncidentsPageHref(filters: IncidentFiltersType, page: number) {
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

  if (filters.reviewStatus && filters.reviewStatus !== "ALL") {
    params.set("reviewStatus", filters.reviewStatus);
  }

  if (filters.severity && filters.severity !== "ALL") {
    params.set("severity", filters.severity);
  }

  if (filters.targetType && filters.targetType !== "ALL") {
    params.set("targetType", filters.targetType);
  }

  if (filters.source && filters.source !== "ALL") {
    params.set("source", filters.source);
  }

  const query = params.toString();
  return query
    ? `/marketplace/dashboard/moderator/incidents?${query}`
    : "/marketplace/dashboard/moderator/incidents";
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
  icon: typeof AlertTriangle;
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

export function ModeratorIncidentsContent(props: {
  data: {
    incidents: IncidentsResult;
    overview: IncidentsOverview;
  };
  filters: IncidentFiltersType;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const visiblePages = getVisiblePages(
    props.data.incidents.pagination.page,
    props.data.incidents.pagination.totalPages,
  );
  const pageStart =
    props.data.incidents.pagination.totalItems === 0
      ? 0
      : (props.data.incidents.pagination.page - 1) * PAGE_SIZE + 1;
  const pageEnd =
    props.data.incidents.pagination.totalItems === 0
      ? 0
      : Math.min(
          props.data.incidents.pagination.page * PAGE_SIZE,
          props.data.incidents.pagination.totalItems,
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
          label="Open Incidents"
          value={props.data.overview.openCount}
          accent="text-[var(--brand-blue)]"
          icon={AlertTriangle}
        />
        <MetricCard
          label="Pending Human Review"
          value={props.data.overview.pendingReviewCount}
          accent="text-amber-600"
          icon={ShieldAlert}
        />
        <MetricCard
          label="Critical Cases"
          value={props.data.overview.criticalCount}
          accent="text-red-600"
          icon={Siren}
        />
      </div>

      <IncidentFilters isPending={isPending} onNavigate={navigate} />

      <div className="relative">
        {isPending ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px] dark:bg-zinc-950/60">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Updating incidents
            </div>
          </div>
        ) : null}

        <div
          aria-busy={isPending}
          className={`space-y-4 transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}
        >
          <IncidentsTable incidents={props.data.incidents.items} />

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.2)] dark:border-zinc-800 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500 dark:text-zinc-400">
              Showing {formatModerationNumber(pageStart)}-
              {formatModerationNumber(pageEnd)} of{" "}
              {formatModerationNumber(
                props.data.incidents.pagination.totalItems,
              )}{" "}
              matching incidents
            </div>

            <Pagination className="justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  {props.data.incidents.pagination.hasPreviousPage ? (
                    <PaginationPrevious
                      href={buildIncidentsPageHref(
                        props.filters,
                        props.data.incidents.pagination.page - 1,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildIncidentsPageHref(
                            props.filters,
                            props.data.incidents.pagination.page - 1,
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
                      href={buildIncidentsPageHref(props.filters, 1)}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(buildIncidentsPageHref(props.filters, 1));
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
                      href={buildIncidentsPageHref(props.filters, page)}
                      isActive={page === props.data.incidents.pagination.page}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(buildIncidentsPageHref(props.filters, page));
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {visiblePages[visiblePages.length - 1] <
                props.data.incidents.pagination.totalPages - 1 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}

                {visiblePages[visiblePages.length - 1] !==
                props.data.incidents.pagination.totalPages ? (
                  <PaginationItem>
                    <PaginationLink
                      href={buildIncidentsPageHref(
                        props.filters,
                        props.data.incidents.pagination.totalPages,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildIncidentsPageHref(
                            props.filters,
                            props.data.incidents.pagination.totalPages,
                          ),
                        );
                      }}
                    >
                      {props.data.incidents.pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                ) : null}

                <PaginationItem>
                  {props.data.incidents.pagination.hasNextPage ? (
                    <PaginationNext
                      href={buildIncidentsPageHref(
                        props.filters,
                        props.data.incidents.pagination.page + 1,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildIncidentsPageHref(
                            props.filters,
                            props.data.incidents.pagination.page + 1,
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
