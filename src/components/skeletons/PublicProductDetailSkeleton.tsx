import { Skeleton } from "@/components/ui/skeleton";

export default function PublicProductDetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-8 px-3 py-8 sm:px-6 lg:px-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20 rounded-lg" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-28 rounded-lg" />
      </div>

      <section className="grid grid-cols-1 gap-8 rounded-2xl border bg-white p-5 shadow-sm dark:bg-neutral-900 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:p-6">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-xl" />

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>

          <div className="flex justify-between gap-3">
            <Skeleton className="h-10 w-full max-w-md rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-48 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-neutral-900">
            <div className="space-y-3">
              <Skeleton className="h-10 w-36 rounded-lg" />
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-14 rounded-full" />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-11 rounded-full" />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          <div className="space-y-3 rounded-xl border bg-gray-50 p-4 dark:bg-neutral-900">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-4 w-44 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </section>
      </section>

      <section className="rounded-2xl border bg-white shadow-sm dark:bg-neutral-900">
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-7 w-40 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl sm:h-32" />
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm dark:bg-neutral-900">
        <Skeleton className="h-7 w-56 rounded-lg" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4 shadow-sm">
            <Skeleton className="h-6 w-40 rounded-lg" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-4/5 rounded-lg" />
            ))}
          </div>

          <div className="space-y-3 rounded-lg border p-4 shadow-sm">
            <Skeleton className="h-6 w-44 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-48 rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_3fr] items-center gap-2">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-xl border p-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-4/5 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
