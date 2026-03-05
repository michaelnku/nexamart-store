import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPageSkeleton() {
  return (
    <div
      className="
        bg-background
        min-h-[180vh]
        sm:min-h-[160vh]
        lg:min-h-[130vh]
      "
    >
      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Skeleton className="h-6 w-48" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </main>
    </div>
  );
}
