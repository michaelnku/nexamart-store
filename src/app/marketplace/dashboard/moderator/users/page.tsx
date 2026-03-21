import { AlertOctagon, ShieldAlert, ShieldX } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  MODERATION_USERS_PAGE_SIZE,
  getModerationUsers,
  getModerationUsersOverview,
} from "@/lib/moderation/getModerationUsers";
import { parseModerationUsersSearchParams } from "@/lib/moderation/usersQuery";
import { ModeratorUsersFilters } from "./_components/ModeratorUsersFilters";
import { ModeratorUsersTable } from "./_components/ModeratorUsersTable";

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildUsersPageHref(
  filters: ReturnType<typeof parseModerationUsersSearchParams>,
  page: number,
) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.role && filters.role !== "ALL") {
    params.set("role", filters.role);
  }

  if (filters.state && filters.state !== "ALL") {
    params.set("state", filters.state);
  }

  if (filters.blocked && filters.blocked !== "ALL") {
    params.set("blocked", filters.blocked);
  }

  const query = params.toString();
  return query
    ? `/marketplace/dashboard/moderator/users?${query}`
    : "/marketplace/dashboard/moderator/users";
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
  icon: typeof AlertOctagon;
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
            {value.toLocaleString()}
          </h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 p-3 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function ModeratorUsersPage(props: {
  searchParams: SearchParams;
}) {
  await requireModerator();
  const filters = parseModerationUsersSearchParams(await props.searchParams);

  const [usersResult, overview] = await Promise.all([
    getModerationUsers(filters),
    getModerationUsersOverview(filters),
  ]);
  const visiblePages = getVisiblePages(
    usersResult.pagination.page,
    usersResult.pagination.totalPages,
  );
  const pageStart =
    usersResult.pagination.totalItems === 0
      ? 0
      : (usersResult.pagination.page - 1) * MODERATION_USERS_PAGE_SIZE + 1;
  const pageEnd =
    usersResult.pagination.totalItems === 0
      ? 0
      : Math.min(
          usersResult.pagination.page * MODERATION_USERS_PAGE_SIZE,
          usersResult.pagination.totalItems,
        );

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="space-y-2">
        <span className={styles.eyebrow}>Moderator Users</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moderate Users</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review moderation state, strike history, restrictions, and user-level
            patterns.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Blocked Users"
          value={overview.blockedCount}
          accent="text-red-600"
          icon={ShieldX}
        />
        <MetricCard
          label="Warned / Restricted"
          value={overview.warnedCount}
          accent="text-amber-600"
          icon={ShieldAlert}
        />
        <MetricCard
          label="High Risk Users"
          value={overview.highRiskCount}
          accent="text-[var(--brand-blue)]"
          icon={AlertOctagon}
        />
      </div>

      <ModeratorUsersFilters />
      <ModeratorUsersTable users={usersResult.items} />

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.2)] dark:border-zinc-800 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500 dark:text-zinc-400">
          Showing {pageStart.toLocaleString()}-{pageEnd.toLocaleString()} of{" "}
          {usersResult.pagination.totalItems.toLocaleString()} matching users
        </div>

        <Pagination className="justify-start md:justify-end">
          <PaginationContent>
            <PaginationItem>
              {usersResult.pagination.hasPreviousPage ? (
                <PaginationPrevious
                  href={buildUsersPageHref(filters, usersResult.pagination.page - 1)}
                />
              ) : (
                <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-slate-300 dark:text-zinc-700">
                  Previous
                </span>
              )}
            </PaginationItem>

            {visiblePages[0] !== 1 ? (
              <PaginationItem>
                <PaginationLink href={buildUsersPageHref(filters, 1)}>
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
                  href={buildUsersPageHref(filters, page)}
                  isActive={page === usersResult.pagination.page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {visiblePages[visiblePages.length - 1] <
            usersResult.pagination.totalPages - 1 ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}

            {visiblePages[visiblePages.length - 1] !==
            usersResult.pagination.totalPages ? (
              <PaginationItem>
                <PaginationLink
                  href={buildUsersPageHref(filters, usersResult.pagination.totalPages)}
                >
                  {usersResult.pagination.totalPages}
                </PaginationLink>
              </PaginationItem>
            ) : null}

            <PaginationItem>
              {usersResult.pagination.hasNextPage ? (
                <PaginationNext
                  href={buildUsersPageHref(filters, usersResult.pagination.page + 1)}
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
  );
}
