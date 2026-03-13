import { Skeleton } from "@/components/ui/skeleton";

export default function SellerEarningsLoading() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
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
            <div key={index} className="grid gap-3 border-t pt-4 sm:grid-cols-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20 sm:justify-self-end" />
              <Skeleton className="h-5 w-20 sm:justify-self-end" />
              <Skeleton className="h-5 w-20 sm:justify-self-end" />
              <Skeleton className="h-6 w-24 rounded-full sm:justify-self-end" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
