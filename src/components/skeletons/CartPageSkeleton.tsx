"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function CartPageSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 min-h-screen space-y-6">
      {/* PAGE TITLE */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-28" /> {/* Cart title */}
        <Skeleton className="h-6 w-10" /> {/* (count) */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT CART LIST */}
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 sm:p-5 border rounded-xl shadow-sm bg-white space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                {/* IMAGE + PRODUCT INFO */}
                <div className="flex gap-4 w-full">
                  {/* IMAGE */}
                  <Skeleton className="w-28 h-28 sm:w-32 sm:h-32 rounded-md" />

                  <div className="flex flex-col justify-between w-full space-y-2">
                    {/* PRODUCT NAME */}
                    <Skeleton className="h-5 w-2/3" />

                    {/* VARIANT */}
                    <Skeleton className="h-4 w-1/3" />

                    {/* REMOVE BUTTON */}
                    <Skeleton className="h-4 w-16" />

                    {/* MOBILE PRICE */}
                    <div className="sm:hidden">
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                </div>

                {/* PRICE + QTY CONTROLS */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  {/* DESKTOP PRICE */}
                  <Skeleton className="hidden sm:block h-6 w-24" />

                  {/* QUANTITY CONTROLS */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-5 w-8" />
                    <Skeleton className="h-10 w-10 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ORDER SUMMARY */}
        <div>
          <div className="sticky top-24 p-6 rounded-xl border shadow-sm bg-white space-y-4">
            <Skeleton className="h-6 w-36" /> {/* Order Summary title */}
            {/* Subtotal row */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            {/* Shipping row */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-px w-full" /> {/* Divider */}
            {/* Total */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            {/* Checkout button */}
            <Skeleton className="h-12 w-full rounded-lg mt-4" />
          </div>
        </div>
      </div>
    </main>
  );
}
