import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPageSkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-60 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <section
            key={index}
            className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Skeleton className="h-5 w-44 rounded-lg" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
