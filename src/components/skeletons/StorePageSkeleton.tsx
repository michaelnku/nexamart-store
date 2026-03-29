import { Skeleton } from "@/components/ui/skeleton";

export default function StorePageSkeleton() {
  return (
    <section className="min-h-full py-4">
      <main className="max-w-6xl mx-auto space-y-12 shadow-md rounded-md">
        {/* ░░░ Banner / Cover Photo ░░░ */}
        <div className="min-h-[220px] md:min-h-[300px]">
          <Skeleton className="w-full h-48 md:h-64 rounded-tr-md rounded-tl-md" />
          <Skeleton className="h-10 w-full rounded-br-md rounded-bl-md" />
        </div>

        {/* HEADER */}
        <section className="flex flex-col items-center gap-4 text-center -mt-16 sm:-mt-20 pb-2">
          <Skeleton className="w-32 h-32 rounded-full border shadow" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-16 w-full sm:w-[65%] max-w-2xl" />
        </section>

        {/* ░░░ PRODUCTS ░░░ */}
        <section className="space-y-6 px-6 py-6">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-xl p-3 space-y-3 bg-muted/20"
              >
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </section>
  );
}
