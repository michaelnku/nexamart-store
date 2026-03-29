import ProductCardSkeleton from "@/components/skeletons/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="grid items-center gap-6 overflow-hidden rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-10 w-full max-w-lg rounded-xl sm:h-12" />
          <Skeleton className="h-4 w-full max-w-md rounded-lg" />
          <Skeleton className="h-4 w-5/6 max-w-sm rounded-lg" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="hidden justify-center lg:flex">
          <Skeleton className="h-72 w-full max-w-sm rounded-[2rem]" />
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((__, cardIndex) => (
              <ProductCardSkeleton key={cardIndex} />
            ))}
          </div>
          <div className="h-px bg-border" />
        </section>
      ))}

      <section className="space-y-3">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
