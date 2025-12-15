"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function WalletSkeleton() {
  return (
    <main className="max-w-4xl mx-auto py-10 px-4 space-y-10">
      {/* HEADER */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* BALANCE SUMMARY CARDS */}
      <section className="grid md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-xl shadow-sm p-5 bg-background space-y-4"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </section>

      {/* PROGRESS BAR */}
      <section className="border rounded-xl shadow-sm p-6 space-y-4 bg-background">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-24" />
      </section>

      {/* TRANSACTION TABLE */}
      <section className="border rounded-xl shadow-sm p-4 space-y-3 bg-background">
        <Skeleton className="h-5 w-40" />

        <div className="border rounded-md overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function CustomerWalletSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-11 w-32 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>

      {/* BALANCE CARD */}
      <div className="border shadow-sm rounded-xl p-6 space-y-5 bg-background">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-3 w-60" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="border shadow-sm rounded-xl bg-background">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>

        <div className="space-y-4 py-6 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
