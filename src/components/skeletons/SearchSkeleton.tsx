import { Skeleton } from "@/components/ui/skeleton";

export default function SearchSkeleton() {
  return (
    <div className="space-y-2 px-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-2 rounded-lg items-center">
          {/* Image */}
          <Skeleton className="w-10 h-10 rounded-md" />

          {/* Text */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-2 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
