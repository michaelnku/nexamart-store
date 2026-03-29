import { Skeleton } from "@/components/ui/skeleton";

type StoreDirectorySkeletonProps = {
  variant?: "store" | "followed";
};

export default function StoreDirectorySkeleton({
  variant = "store",
}: StoreDirectorySkeletonProps) {
  const titleClassName = variant === "followed" ? "w-48" : "w-40";

  return (
    <main className="mx-auto min-h-full w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <Skeleton className={`h-8 rounded-lg ${titleClassName}`} />
        <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
