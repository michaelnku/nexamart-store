import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePageSkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
        </header>

        <section className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-4 w-56 max-w-full rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-200/70 pt-5 dark:border-zinc-800 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded-lg" />
              <Skeleton className="h-5 w-36 rounded-lg" />
            </div>
          </div>

          <div className="border-t border-slate-200/70 pt-5 dark:border-zinc-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-10 w-full rounded-lg sm:w-40" />
              <Skeleton className="h-10 w-full rounded-lg sm:w-32" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <Skeleton className="h-6 w-36 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md rounded-lg" />
            <Skeleton className="h-10 w-52 rounded-lg" />
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  );
}
