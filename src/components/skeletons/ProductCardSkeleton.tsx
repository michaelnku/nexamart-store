import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border bg-card p-3 shadow-sm">
      <div className="relative">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="absolute left-3 top-3 h-5 w-12 rounded-md" />
        <Skeleton className="absolute right-3 top-3 h-8 w-8 rounded-full" />
      </div>

      <div className="flex flex-1 flex-col space-y-3 pt-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-5/6 rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-4 w-14 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-20 rounded-lg" />
        <div className="mt-auto">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
