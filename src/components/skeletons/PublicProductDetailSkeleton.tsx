import { Skeleton } from "@/components/ui/skeleton";

export default function PublicProductDetailSkeleton() {
  return (
    <main className="w-full max-w-[1200px] mx-auto space-y-10 py-8 px-3 sm:px-6 lg:px-4">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-neutral-900 border rounded-xl shadow p-5 items-stretch">
        <div className="space-y-4 lg:h-full">
          <div className="lg:flex lg:gap-4 lg:h-full">
            <div className="hidden lg:flex lg:flex-col lg:gap-2 lg:w-20">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-lg" />
              ))}
            </div>

            <Skeleton className="w-full h-[320px] sm:h-[380px] lg:h-full lg:min-h-[520px] rounded-xl" />
          </div>

          <div className="flex gap-2 px-2 sm:px-6 md:px-10 overflow-x-auto lg:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-[64px] rounded-lg" />
            ))}
          </div>
        </div>

        <section className="space-y-7">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-9 w-full sm:w-3/5" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-36" />
          </div>

          <Skeleton className="h-6 w-40 rounded-full" />

          <div className="p-6 rounded-xl border bg-white dark:bg-neutral-900 shadow space-y-3 min-h-[96px]">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-14 rounded-full" />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-11 rounded-full" />
              ))}
            </div>
          </div>

          <Skeleton className="h-12 w-full rounded-lg" />

          <div className="border p-4 rounded-xl bg-gray-50 dark:bg-neutral-900 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-44" />
          </div>
        </section>
      </section>

      <section className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm">
        <Skeleton className="h-7 w-40 m-4" />
        <Skeleton className="h-24 sm:h-32 m-4" />
      </section>

      <section className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm p-6 space-y-6">
        <Skeleton className="h-7 w-56" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg shadow-sm p-4 space-y-3">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-4/5" />
            ))}
          </div>

          <div className="border rounded-lg shadow-sm p-4 space-y-3">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="border rounded-lg shadow-sm p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_3fr] gap-2 items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
