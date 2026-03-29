import { Skeleton } from "@/components/ui/skeleton";

export default function StorePageSkeleton() {
  return (
    <section className="min-h-full bg-white px-4 py-8 dark:bg-zinc-900 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative">
          <Skeleton className="h-56 w-full rounded-none sm:h-64 lg:h-72" />
          <div className="border-t border-slate-200/80 p-3 dark:border-zinc-800">
            <Skeleton className="h-5 w-48 rounded-lg" />
          </div>
        </div>

        <section className="px-6 pb-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Skeleton className="-mt-16 h-32 w-32 rounded-full border-4 border-white bg-white dark:border-zinc-950 dark:bg-zinc-900" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Skeleton className="h-10 w-56 rounded-xl" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-36 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-16 w-full max-w-2xl rounded-xl sm:w-[65%]" />
          </div>

          <section className="mt-10 space-y-6">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-4/5 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
    </section>
  );
}
