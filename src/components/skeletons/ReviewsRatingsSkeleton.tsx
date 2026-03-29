import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewsRatingsSkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-5xl space-y-10 px-4 py-8">
      <section className="space-y-2">
        <Skeleton className="h-8 w-52 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </section>

      <section className="space-y-4">
        <Skeleton className="h-7 w-40 rounded-lg" />
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={index} className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-4 w-40 rounded-lg" />
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200/70 p-4 dark:border-zinc-800">
              <Skeleton className="h-5 w-28 rounded-lg" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((__, starIndex) => (
                  <Skeleton key={starIndex} className="h-8 w-8 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <Skeleton className="h-7 w-44 rounded-lg" />
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-4 w-32 rounded-lg" />
          </article>
        ))}
      </section>
    </main>
  );
}
