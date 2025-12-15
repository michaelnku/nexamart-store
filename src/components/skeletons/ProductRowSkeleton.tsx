"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ProductRowSkeleton({ title }: { title: string }) {
  const heights = [240, 260, 220, 280, 250, 270, 230, 260];

  return (
    <section className="mb-10 space-y-4">
      {/* Section title */}
      <Skeleton className="h-5 w-48 rounded-md" />

      {/* Product cards */}
      <div className="flex gap-4 overflow-hidden">
        {heights.map((h, i) => (
          <Skeleton
            key={i}
            className="min-w-[200px] rounded-xl ring-1 ring-[var(--brand-blue)]/5"
            style={{ height: h }}
          />
        ))}
      </div>
    </section>
  );
}
