import ProductCardSkeleton from "@/components/skeletons/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

type ProductListingSkeletonProps = {
  variant?: "catalog" | "recommended" | "history";
};

export default function ProductListingSkeleton({
  variant = "catalog",
}: ProductListingSkeletonProps) {
  const isRecommended = variant === "recommended";
  const isHistory = variant === "history";

  return (
    <main className="mx-auto min-h-full w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded-lg sm:h-8 sm:w-56" />
          <Skeleton
            className={`h-4 rounded-lg ${isRecommended ? "w-80 max-w-full" : isHistory ? "w-36" : "w-28"}`}
          />
        </div>
        {isHistory ? <Skeleton className="h-10 w-32 rounded-lg" /> : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
