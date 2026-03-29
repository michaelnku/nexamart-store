import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistCardSkeleton() {
  return (
    <div className="w-full space-y-4 rounded-xl border bg-card p-3 shadow-sm">
      <Skeleton className="aspect-square w-full rounded-xl" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-lg" />
        <Skeleton className="h-3 w-1/3 rounded-lg" />

        <div className="mt-3 flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
