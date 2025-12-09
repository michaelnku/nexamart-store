"use client";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="border rounded-xl bg-white shadow-sm p-0 overflow-hidden animate-pulse">
      {/* Image */}
      <div className="relative">
        <Skeleton className="h-60 w-full rounded-none" />
        {/* Floating wishlist circle placeholder */}
        <Skeleton className="h-6 w-6 rounded-full absolute top-3 right-3" />
      </div>

      <div className="space-y-3 p-4">
        {/* Product title */}
        <Skeleton className="h-4 w-5/6" />

        {/* Price row */}
        <div className="flex items-center gap-2 mt-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}
