import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryDirectorySkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-6xl space-y-10 px-6 py-6">
      <Skeleton className="h-7 w-56 rounded-lg" />

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center space-y-3 rounded-xl border p-4 text-center"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
