"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export const StoreSettingsSkeleton = () => {
  return (
    <main className="max-w-3xl mx-auto animate-fadeIn">
      {/* Page title */}
      <Skeleton className="h-9 w-48 mb-8 " />

      <div className="space-y-10">
        {/* BUSINESS PROFILE */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 space-y-6">
          <Skeleton className="h-6 w-40 " />

          <div className="space-y-4">
            <Skeleton className="h-10 w-full " />
            <Skeleton className="h-10 w-full " />
            <Skeleton className="h-10 w-full " />
            <Skeleton className="h-20 w-full " />
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full " />
            <Skeleton className="h-8 w-32 " />
          </div>
        </section>

        {/* STOREFRONT APPEARANCE */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 space-y-6">
          <Skeleton className="h-6 w-48 " />

          {/* Banner */}
          <Skeleton className="h-44 w-full rounded-xl " />

          {/* Tagline */}
          <Skeleton className="h-10 w-full " />
        </section>

        {/* PREFERENCES */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-6 space-y-6">
          <Skeleton className="h-6 w-40 " />

          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44 " />
            <Skeleton className="h-7 w-14 rounded-full " />
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44 " />
            <Skeleton className="h-7 w-14 rounded-full " />
          </div>
        </section>

        {/* SAVE BUTTON */}
        <Skeleton className="h-12 w-full rounded-xl " />

        {/* Loading footer */}
        <div className="flex justify-center items-center gap-2 pt-6 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading store settings...</span>
        </div>
      </div>
    </main>
  );
};
