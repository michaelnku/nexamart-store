import Link from "next/link";
import { FileSearch, Filter, Search, ShieldCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";

import {
  DashboardHero,
  PremiumPanel,
  PremiumStatCard,
} from "@/app/marketplace/_components/PremiumDashboard";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getAdminAuditLogs,
  parseAdminAuditLogsSearchParams,
} from "@/lib/audit/query";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_TYPES,
  AUDIT_ENTITY_LABELS,
  AUDIT_ENTITY_TYPES,
  type AuditActionType,
  type AuditEntityType,
  type AuditLogListItem,
  type AuditMetadata,
} from "@/lib/audit/types";
import { CurrentUser } from "@/lib/currentUser";
import { cn } from "@/lib/utils";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function stringifyMetadataValue(value: AuditMetadata): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return value.map(stringifyMetadataValue).join(", ");
  if (typeof value === "object") return "object";
  return String(value);
}

function getActionBadgeClass(actionType: AuditActionType) {
  if (actionType.includes("WITHDRAWAL") || actionType.includes("SETTINGS")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (actionType.includes("DISPUTE") || actionType.includes("DELIVERY")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (actionType.includes("ROLE") || actionType.includes("VERIFICATION")) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-violet-200 bg-violet-50 text-violet-700";
}

function getEntityBadgeClass(entityType: AuditEntityType) {
  switch (entityType) {
    case "USER":
    case "STAFF_PROFILE":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "DISPUTE":
    case "DELIVERY":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "WITHDRAWAL":
    case "SITE_CONFIGURATION":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function buildQueryString(
  filters: Record<string, string | null | undefined>,
  updates: Record<string, string | number | null | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

function MetadataPreview({
  metadata,
}: {
  metadata: Record<string, AuditMetadata> | null;
}) {
  if (!metadata) return <span className="text-slate-400">No metadata</span>;

  const entries = Object.entries(metadata).slice(0, 3);

  if (entries.length === 0) {
    return <span className="text-slate-400">No metadata</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <Badge
          key={key}
          variant="outline"
          className="max-w-full border-slate-200 bg-slate-50 text-slate-600"
        >
          <span className="truncate">
            {key}: {stringifyMetadataValue(value)}
          </span>
        </Badge>
      ))}
    </div>
  );
}

function AuditRow({ item }: { item: AuditLogListItem }) {
  const actorLabel = item.actor.name || item.actor.email || "System actor";

  return (
    <>
      <tr className="align-top">
        <td className="px-6 py-5 text-sm text-slate-600 dark:text-zinc-300">
          <div className="space-y-1">
            <p className="font-semibold text-slate-950 dark:text-white">
              {actorLabel}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {item.actor.role}
            </p>
            {item.actor.email ? (
              <p className="text-xs">{item.actor.email}</p>
            ) : null}
          </div>
        </td>
        <td className="px-6 py-5">
          <Badge
            variant="outline"
            className={cn("border", getActionBadgeClass(item.actionType))}
          >
            {AUDIT_ACTION_LABELS[item.actionType]}
          </Badge>
        </td>
        <td className="px-6 py-5">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className={cn(
                "border",
                getEntityBadgeClass(item.targetEntityType),
              )}
            >
              {AUDIT_ENTITY_LABELS[item.targetEntityType]}
            </Badge>
            {item.targetEntityId ? (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                ID: {item.targetEntityId}
              </p>
            ) : null}
          </div>
        </td>
        <td className="px-6 py-5">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {item.summary}
            </p>
            <MetadataPreview metadata={item.metadata} />
          </div>
        </td>
        <td className="px-6 py-5 text-sm text-slate-600 dark:text-zinc-300">
          {formatDateTime(item.createdAt)}
        </td>
      </tr>
    </>
  );
}

export default async function AdminAuditLogsPage({ searchParams }: Props) {
  const currentUser = await CurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/403");
  }

  const parsed = parseAdminAuditLogsSearchParams(searchParams);
  const data = await getAdminAuditLogs(parsed);

  const baseFilters = {
    query: data.filters.query || null,
    actor: data.filters.actor || null,
    actionType: data.filters.actionType || null,
    entityType: data.filters.entityType || null,
    from: data.filters.from || null,
    to: data.filters.to || null,
  };

  const previousHref = buildQueryString(baseFilters, {
    page: data.pagination.page - 1,
  });
  const nextHref = buildQueryString(baseFilters, {
    page: data.pagination.page + 1,
  });

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Admin Audit Logs"
        title="Audit Log Explorer"
        description="Review high-value admin actions, dispute decisions, finance approvals, and operational changes from one secure audit surface."
        accentClassName="bg-[linear-gradient(135deg,#0f172a_0%,#134e4a_44%,#1d4ed8_100%)]"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PremiumStatCard
          title="Matching Events"
          value={data.pagination.totalItems}
          description="Audit entries matching the current filters."
          icon={FileSearch}
          tintClassName="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"
        />
        <PremiumStatCard
          title="Actor Scope"
          value={data.filters.actor || "All actors"}
          description="Filter by admin or moderator identity when you need an accountability trail."
          icon={Users}
          tintClassName="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        />
        <PremiumStatCard
          title="Current Page"
          value={`${data.pagination.page}/${data.pagination.totalPages}`}
          description={
            data.filters.actionType
              ? AUDIT_ACTION_LABELS[data.filters.actionType]
              : "Newest audit activity first."
          }
          icon={ShieldCheck}
          tintClassName="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300"
        />
      </section>

      <PremiumPanel
        title="Audit Timeline"
        description="Filter and sort audit activity in reverse-chronological order."
      >
        <div className="space-y-6">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="xl:col-span-2">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Text search
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="query"
                  defaultValue={data.filters.query}
                  placeholder="Summary or target ID"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm outline-none ring-0 transition focus:border-slate-300"
                />
              </div>
            </label>

            <label>
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Actor
              </span>
              <input
                type="text"
                name="actor"
                defaultValue={data.filters.actor}
                placeholder="Name or email"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-slate-300"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Action
              </span>
              <select
                name="actionType"
                defaultValue={data.filters.actionType ?? ""}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-slate-300"
              >
                <option value="">All actions</option>
                {AUDIT_ACTION_TYPES.map((actionType) => (
                  <option key={actionType} value={actionType}>
                    {AUDIT_ACTION_LABELS[actionType]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Entity
              </span>
              <select
                name="entityType"
                defaultValue={data.filters.entityType ?? ""}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-slate-300"
              >
                <option value="">All entities</option>
                {AUDIT_ENTITY_TYPES.map((entityType) => (
                  <option key={entityType} value={entityType}>
                    {AUDIT_ENTITY_LABELS[entityType]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Date range
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  name="from"
                  defaultValue={data.filters.from}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-slate-300"
                />
                <input
                  type="date"
                  name="to"
                  defaultValue={data.filters.to}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-slate-300"
                />
              </div>
            </label>

            <div className="flex items-end gap-2 xl:justify-end">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </button>
              <Link
                href="/marketplace/dashboard/admin/audit-logs"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </Link>
            </div>
          </form>

          {data.items.length === 0 ? (
            <Empty className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileSearch className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No audit events found</EmptyTitle>
                <EmptyDescription>
                  No audit records match the current filters. Broaden the actor,
                  action, or date range to inspect more activity.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-[28px] border border-slate-200/80 bg-white lg:block">
                <table className="min-w-full divide-y divide-slate-200/80">
                  <thead className="bg-slate-50/80">
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                      <th className="px-6 py-4 font-medium">Actor</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                      <th className="px-6 py-4 font-medium">Target</th>
                      <th className="px-6 py-4 font-medium">Summary</th>
                      <th className="px-6 py-4 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {data.items.map((item) => (
                      <AuditRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {data.items.map((item) => {
                  const actorLabel =
                    item.actor.name || item.actor.email || "System actor";

                  return (
                    <article
                      key={item.id}
                      className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-950">
                            {actorLabel}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {item.actor.role}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border",
                            getActionBadgeClass(item.actionType),
                          )}
                        >
                          {AUDIT_ACTION_LABELS[item.actionType]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border",
                            getEntityBadgeClass(item.targetEntityType),
                          )}
                        >
                          {AUDIT_ENTITY_LABELS[item.targetEntityType]}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium text-slate-900">
                          {item.summary}
                        </p>
                        {item.targetEntityId ? (
                          <p className="text-xs text-slate-500">
                            Target ID: {item.targetEntityId}
                          </p>
                        ) : null}
                        <MetadataPreview metadata={item.metadata} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {data.pagination.totalPages > 1 ? (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  {data.pagination.hasPreviousPage ? (
                    <PaginationPrevious
                      href={`/marketplace/dashboard/admin/audit-logs?${previousHref}`}
                    />
                  ) : (
                    <PaginationPrevious
                      aria-disabled="true"
                      className="pointer-events-none opacity-50"
                    />
                  )}
                </PaginationItem>
                <PaginationItem>
                  <Badge
                    variant="outline"
                    className="h-9 rounded-md border-slate-200 px-3 text-slate-600"
                  >
                    {data.pagination.page} / {data.pagination.totalPages}
                  </Badge>
                </PaginationItem>
                <PaginationItem>
                  {data.pagination.hasNextPage ? (
                    <PaginationNext
                      href={`/marketplace/dashboard/admin/audit-logs?${nextHref}`}
                    />
                  ) : (
                    <PaginationNext
                      aria-disabled="true"
                      className="pointer-events-none opacity-50"
                    />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      </PremiumPanel>
    </main>
  );
}
