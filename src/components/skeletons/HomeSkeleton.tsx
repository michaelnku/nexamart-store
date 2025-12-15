"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function HomeSkeleton() {
  return (
    <div className="space-y-10">
      {/* Banner */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-20 rounded-lg ring-1 ring-[var(--brand-blue)]/5"
          />
        ))}
      </div>

      {/* Product Rows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-60 rounded-xl ring-1 ring-[var(--brand-blue)]/5"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
