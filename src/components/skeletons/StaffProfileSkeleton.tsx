import { Skeleton } from "@/components/ui/skeleton";

export default function StaffProfileSkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 py-8">
      <section className="rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52 rounded-lg" />
          <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
        </div>

        <div className="mt-8 space-y-5">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-9 w-44 rounded-lg" />
          </div>

          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}

          <Skeleton className="h-10 w-52 rounded-lg" />
        </div>
      </section>
    </main>
  );
}
