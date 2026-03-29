import SitePageShell from "../../_components/SitePageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategorySlugLoading() {
  return (
    <SitePageShell className="max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Banner Skeleton */}
      <Skeleton className="h-56 w-full rounded-xl" />

      {/* Title + Icon */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Product count */}
      <Skeleton className="h-4 w-40" />

      {/* Subcategory chips */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-44" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </div>

      {/* Products grid skeleton */}
      <section className="space-y-6">
        <Skeleton className="h-5 w-32" />

        <div
          className="
            grid grid-cols-2 
            sm:grid-cols-3 
            md:grid-cols-4 
            lg:grid-cols-5 
            gap-4 sm:gap-6
          "
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </SitePageShell>
  );
}
