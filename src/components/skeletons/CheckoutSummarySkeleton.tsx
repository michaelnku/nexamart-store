"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutSummarySkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
      {/* LEFT — ITEMS LIST */}
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-7 w-40" /> {/* Your items title */}
        {/* Repeat skeleton item rows */}
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4 pb-6 border-b">
            <Skeleton className="w-36 h-36 rounded-lg" />

            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT — SUMMARY SIDEBAR */}
      <div className="space-y-6">
        {/* DELIVERY METHOD */}
        <div className="p-5 rounded-xl border bg-white shadow-sm space-y-4">
          <Skeleton className="h-5 w-40" />

          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* ADDRESS BOX */}
        <div className="p-5 rounded-xl border bg-white shadow-sm space-y-4">
          <Skeleton className="h-5 w-40" />

          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>

          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* ORDER SUMMARY */}
        <div className="p-5 rounded-xl border bg-white shadow-md space-y-4 sticky top-28">
          <Skeleton className="h-6 w-36" />

          {/* Summary rows */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <hr />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>

          {/* Button */}
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
