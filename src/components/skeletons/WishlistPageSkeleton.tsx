"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistPageSkeleton() {
  return (
    <main className="min-h-screen max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" /> {/* Wishlist title */}
          <Skeleton className="h-4 w-64" /> {/* Subtitle */}
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" /> {/* Browse more button */}
      </div>
      <Skeleton className="h-px w-full" /> {/* Separator */}
      {/* GRID OF SKELETON CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-xl bg-white shadow-sm p-3 space-y-3"
          >
            {/* Image */}
            <Skeleton className="w-full aspect-square rounded-lg" />

            {/* Title */}
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />

            {/* Price */}
            <Skeleton className="h-5 w-24" />

            {/* Store name */}
            <Skeleton className="h-3 w-28" />

            {/* Remove button */}
            <Skeleton className="h-4 w-16" />

            {/* Add To Cart button */}
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
