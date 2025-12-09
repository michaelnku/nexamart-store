"use client";
import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistCardSkeleton() {
  return (
    <div className="border rounded-xl bg-white shadow p-2 w-full animate-pulse space-y-4">
      <Skeleton className="h-56 w-full rounded-xl" />

      <div className="p-3 space-y-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />

        <div className="flex gap-2 mt-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  );
}
