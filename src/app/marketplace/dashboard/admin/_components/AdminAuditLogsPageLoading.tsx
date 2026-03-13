import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuditLogsPageLoading() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <Skeleton className="h-40 rounded-[28px]" />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-28 rounded-[24px]" />
        <Skeleton className="h-28 rounded-[24px]" />
        <Skeleton className="h-28 rounded-[24px]" />
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-11 rounded-xl" />
          ))}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[24px] border border-slate-200/80 lg:block">
          <div className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[1.2fr_1fr_0.9fr_1.4fr_1fr] gap-4"
              >
                {Array.from({ length: 5 }).map((__, innerIndex) => (
                  <Skeleton
                    key={innerIndex}
                    className="h-14 rounded-xl"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-[24px]" />
          ))}
        </div>
      </section>
    </main>
  );
}
