"use client";

import { useTransition } from "react";
import { AlertTriangle, EyeOff, LoaderCircle, ShieldAlert } from "lucide-react";
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
import type { parseModeratorProductsSearchParams } from "@/lib/moderation/productsQuery";
import type {
  getModeratorProducts,
  getModeratorProductsOverview,
} from "@/lib/moderation/getModeratorProducts";
import { formatModerationNumber } from "@/lib/moderation/formatters";
import { ModeratorProductsFilters } from "./ModeratorProductsFilters";
import { ModeratorProductsTable } from "./ModeratorProductsTable";

type ProductListResult = Awaited<ReturnType<typeof getModeratorProducts>>;
type ProductOverview = Awaited<ReturnType<typeof getModeratorProductsOverview>>;
type ProductFilters = ReturnType<typeof parseModeratorProductsSearchParams>;

const PAGE_SIZE = 24;

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
};

function buildProductsPageHref(filters: ProductFilters, page: number) {
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

export function ModeratorProductsContent(props: {
  data: {
    products: ProductListResult;
    overview: ProductOverview;
  };
  filters: ProductFilters;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const visiblePages = getVisiblePages(
    props.data.products.pagination.page,
    props.data.products.pagination.totalPages,
  );
  const pageStart =
    props.data.products.pagination.totalItems === 0
      ? 0
      : (props.data.products.pagination.page - 1) * PAGE_SIZE + 1;
  const pageEnd =
    props.data.products.pagination.totalItems === 0
      ? 0
      : Math.min(
          props.data.products.pagination.page * PAGE_SIZE,
          props.data.products.pagination.totalItems,
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
          label="Flagged Products"
          value={props.data.overview.flaggedCount}
          accent="text-[var(--brand-blue)]"
          icon={ShieldAlert}
        />
        <MetricCard
          label="Unpublished"
          value={props.data.overview.unpublishedCount}
          accent="text-amber-600"
          icon={EyeOff}
        />
        <MetricCard
          label="Open Product Incidents"
          value={props.data.overview.openIncidentCount}
          accent="text-red-600"
          icon={AlertTriangle}
        />
      </div>

      <ModeratorProductsFilters isPending={isPending} onNavigate={navigate} />

      <div className="relative">
        {isPending ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px] dark:bg-zinc-950/60">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Updating products
            </div>
          </div>
        ) : null}

        <div
          aria-busy={isPending}
          className={`space-y-4 transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}
        >
          <ModeratorProductsTable products={props.data.products.items} />

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.2)] dark:border-zinc-800 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500 dark:text-zinc-400">
              Showing {formatModerationNumber(pageStart)}-
              {formatModerationNumber(pageEnd)} of{" "}
              {formatModerationNumber(props.data.products.pagination.totalItems)}{" "}
              matching products
            </div>

            <Pagination className="justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  {props.data.products.pagination.hasPreviousPage ? (
                    <PaginationPrevious
                      href={buildProductsPageHref(
                        props.filters,
                        props.data.products.pagination.page - 1,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildProductsPageHref(
                            props.filters,
                            props.data.products.pagination.page - 1,
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
                      href={buildProductsPageHref(props.filters, 1)}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(buildProductsPageHref(props.filters, 1));
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
                      href={buildProductsPageHref(props.filters, page)}
                      isActive={page === props.data.products.pagination.page}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(buildProductsPageHref(props.filters, page));
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {visiblePages[visiblePages.length - 1] <
                props.data.products.pagination.totalPages - 1 ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}

                {visiblePages[visiblePages.length - 1] !==
                props.data.products.pagination.totalPages ? (
                  <PaginationItem>
                    <PaginationLink
                      href={buildProductsPageHref(
                        props.filters,
                        props.data.products.pagination.totalPages,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildProductsPageHref(
                            props.filters,
                            props.data.products.pagination.totalPages,
                          ),
                        );
                      }}
                    >
                      {props.data.products.pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                ) : null}

                <PaginationItem>
                  {props.data.products.pagination.hasNextPage ? (
                    <PaginationNext
                      href={buildProductsPageHref(
                        props.filters,
                        props.data.products.pagination.page + 1,
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(
                          buildProductsPageHref(
                            props.filters,
                            props.data.products.pagination.page + 1,
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
