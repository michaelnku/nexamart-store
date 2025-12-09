import { Skeleton } from "@/components/ui/skeleton";

export default function PublicProductDetailSkeleton() {
  return (
    <main className="max-w-7xl mx-auto space-y-10 py-8 px-3 sm:px-6">
      {/* --- TOP SECTION --- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-neutral-900 border rounded-xl shadow p-5">
        {/* LEFT IMAGES */}
        <div className="space-y-4">
          {/* Main Image */}
          <Skeleton className="aspect-square w-full rounded-xl" />

          {/* Thumbnail Row */}
          <div className="flex gap-2 px-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-[72px] rounded-lg" />
            ))}
          </div>
        </div>

        {/* RIGHT INFORMATION */}
        <section className="space-y-7">
          {/* Title + Wishlist */}
          <div className="flex justify-between gap-2">
            <Skeleton className="h-9 w-3/5" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>

          {/* Brand + Store + Rating */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Stock Tag */}
          <Skeleton className="h-6 w-40 rounded-full" />

          {/* Pricing Box */}
          <div className="p-6 rounded-xl border bg-white dark:bg-neutral-900 shadow space-y-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-14 rounded-full" />
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-11 rounded-full" />
              ))}
            </div>
          </div>

          {/* Add to Cart */}
          <Skeleton className="h-12 w-full rounded-lg" />

          {/* Badges */}
          <div className="border p-4 rounded-xl bg-gray-50 dark:bg-neutral-900 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-44" />
          </div>
        </section>
      </section>

      {/* --- DESCRIPTION --- */}
      <section className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm">
        <Skeleton className="h-7 w-40 m-4" />
        <Skeleton className="h-24 m-4" />
      </section>

      {/* --- SPECS + TECH DETAIL BOXES --- */}
      <section className="bg-white dark:bg-neutral-900 border rounded-xl shadow-sm p-6 space-y-6">
        {/* Title */}
        <Skeleton className="h-7 w-56" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Features */}
          <div className="border rounded-lg shadow-sm p-4 space-y-3">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-4/5" />
            ))}
          </div>

          {/* What's in the box */}
          <div className="border rounded-lg shadow-sm p-4 space-y-3">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Technical Details */}
        <div className="border rounded-lg shadow-sm p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_3fr] gap-2 items-center"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
