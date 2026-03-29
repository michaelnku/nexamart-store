import { Skeleton } from "@/components/ui/skeleton";

export default function ReferralsPageSkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-5xl space-y-6 px-6 py-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>

      <section className="rounded-xl border bg-card p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md rounded-lg" />
          <Skeleton className="h-10 w-56 rounded-lg" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-6">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="mt-3 h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      <section className="rounded-xl border bg-card p-6">
        <Skeleton className="mb-4 h-6 w-40 rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-3 border-t pt-3 sm:grid-cols-4">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-5 w-full rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
