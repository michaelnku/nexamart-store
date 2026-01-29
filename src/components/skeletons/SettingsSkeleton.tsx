import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background py-4">
      {/* MOBILE NAV SKELETON */}
      <div className="md:hidden px-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex gap-8 px-4 py-12">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:block w-64 shrink-0 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </aside>

        {/* CONTENT */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* SECTION TITLE */}
          <Skeleton className="h-6 w-48" />

          {/* CARD */}
          <div className="border rounded-xl p-6 space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
