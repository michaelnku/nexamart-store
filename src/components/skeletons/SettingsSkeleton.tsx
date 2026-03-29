import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsSkeleton() {
  return (
    <div className="min-h-full bg-background py-4">
      <div className="px-4 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-12">
        <aside className="hidden w-64 shrink-0 space-y-2 md:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <Skeleton className="h-6 w-48 rounded-lg" />

          <div className="space-y-4 rounded-xl border p-6">
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />

            <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
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
