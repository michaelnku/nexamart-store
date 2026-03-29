import ProductCardSkeleton from "@/components/skeletons/ProductCardSkeleton";
import SearchSkeleton from "@/components/skeletons/SearchSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPageSkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-7xl space-y-8 px-4 py-10 text-slate-950 dark:text-zinc-100">
      <section className="space-y-2">
        <Skeleton className="h-8 w-80 max-w-full rounded-lg" />
        <Skeleton className="h-4 w-32 rounded-lg" />
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-20 rounded-lg" />
        <SearchSkeleton />
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded-lg" />
                  <Skeleton className="h-3 w-20 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-4 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
