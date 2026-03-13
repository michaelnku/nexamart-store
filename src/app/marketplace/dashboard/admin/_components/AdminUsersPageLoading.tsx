import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersPageLoading() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <Skeleton className="h-40 rounded-[28px]" />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-[24px]" />
        <Skeleton className="h-28 rounded-[24px]" />
        <Skeleton className="h-28 rounded-[24px]" />
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[24px] border border-slate-200/80 lg:block">
          <div className="border-b border-slate-200/80 px-6 py-4">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.1fr] gap-4"
              >
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-[24px]" />
          ))}
        </div>
      </section>
    </main>
  );
}
