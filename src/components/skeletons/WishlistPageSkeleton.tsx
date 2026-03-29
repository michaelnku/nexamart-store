"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistPageSkeleton() {
  return (
    <main className="min-h-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      <Skeleton className="h-px w-full" />

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-xl bg-white dark:bg-neutral-900 shadow-sm p-3 space-y-3 animate-pulse"
          >
            <Skeleton className="w-full aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
