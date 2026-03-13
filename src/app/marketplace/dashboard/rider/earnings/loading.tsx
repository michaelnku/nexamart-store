import { Skeleton } from "@/components/ui/skeleton";

export default function RiderEarningsLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-32" />
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-4 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-3 border-t pt-4 sm:grid-cols-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-24 sm:justify-self-end" />
              <Skeleton className="h-6 w-24 rounded-full sm:justify-self-end" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
