import { AlertTriangle, EyeOff, ShieldAlert } from "lucide-react";
import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  MODERATOR_PRODUCTS_PAGE_SIZE,
  getModeratorProducts,
  getModeratorProductsOverview,
} from "@/lib/moderation/getModeratorProducts";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { parseModeratorProductsSearchParams } from "@/lib/moderation/productsQuery";
import { ModeratorProductsFilters } from "./_components/ModeratorProductsFilters";
import { ModeratorProductsTable } from "./_components/ModeratorProductsTable";

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildProductsPageHref(
  filters: ReturnType<typeof parseModeratorProductsSearchParams>,
  page: number,
) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.published && filters.published !== "ALL") {
    params.set("published", filters.published);
  }

  if (filters.foodType && filters.foodType !== "ALL") {
    params.set("foodType", filters.foodType);
  }

  if (filters.flagged && filters.flagged !== "ALL") {
    params.set("flagged", filters.flagged);
  }

  const query = params.toString();
  return query
    ? `/marketplace/dashboard/moderator/products?${query}`
    : "/marketplace/dashboard/moderator/products";
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

export default async function ModeratorProductsPage(props: {
  searchParams: SearchParams;
}) {
  await requireModerator();
  const filters = parseModeratorProductsSearchParams(await props.searchParams);

  const [productsResult, overview] = await Promise.all([
    getModeratorProducts(filters),
    getModeratorProductsOverview(filters),
  ]);
  const visiblePages = getVisiblePages(
    productsResult.pagination.page,
    productsResult.pagination.totalPages,
  );
  const pageStart =
    productsResult.pagination.totalItems === 0
      ? 0
      : (productsResult.pagination.page - 1) * MODERATOR_PRODUCTS_PAGE_SIZE + 1;
  const pageEnd =
    productsResult.pagination.totalItems === 0
      ? 0
      : Math.min(
          productsResult.pagination.page * MODERATOR_PRODUCTS_PAGE_SIZE,
          productsResult.pagination.totalItems,
        );

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="space-y-2">
        <span className={styles.eyebrow}>Moderator Products</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Moderation
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review listing visibility, product risk signals, and linked moderation
            incidents.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Flagged Products"
          value={overview.flaggedCount}
          accent="text-[var(--brand-blue)]"
          icon={ShieldAlert}
        />
        <MetricCard
          label="Unpublished"
          value={overview.unpublishedCount}
          accent="text-amber-600"
          icon={EyeOff}
        />
        <MetricCard
          label="Open Product Incidents"
          value={overview.openIncidentCount}
          accent="text-red-600"
          icon={AlertTriangle}
        />
      </div>

      <ModeratorProductsFilters />
      <ModeratorProductsTable products={productsResult.items} />

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.2)] dark:border-zinc-800 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500 dark:text-zinc-400">
          Showing {pageStart.toLocaleString()}-{pageEnd.toLocaleString()} of{" "}
          {productsResult.pagination.totalItems.toLocaleString()} matching
          products
        </div>

        <Pagination className="justify-start md:justify-end">
          <PaginationContent>
            <PaginationItem>
              {productsResult.pagination.hasPreviousPage ? (
                <PaginationPrevious
                  href={buildProductsPageHref(
                    filters,
                    productsResult.pagination.page - 1,
                  )}
                />
              ) : (
                <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-slate-300 dark:text-zinc-700">
                  Previous
                </span>
              )}
            </PaginationItem>

            {visiblePages[0] !== 1 ? (
              <PaginationItem>
                <PaginationLink href={buildProductsPageHref(filters, 1)}>
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
                  href={buildProductsPageHref(filters, page)}
                  isActive={page === productsResult.pagination.page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {visiblePages[visiblePages.length - 1] <
            productsResult.pagination.totalPages - 1 ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}

            {visiblePages[visiblePages.length - 1] !==
            productsResult.pagination.totalPages ? (
              <PaginationItem>
                <PaginationLink
                  href={buildProductsPageHref(
                    filters,
                    productsResult.pagination.totalPages,
                  )}
                >
                  {productsResult.pagination.totalPages}
                </PaginationLink>
              </PaginationItem>
            ) : null}

            <PaginationItem>
              {productsResult.pagination.hasNextPage ? (
                <PaginationNext
                  href={buildProductsPageHref(
                    filters,
                    productsResult.pagination.page + 1,
                  )}
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
