import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesPageSkeleton() {
  return (
    <main className="mx-auto min-h-full w-full max-w-5xl overflow-hidden bg-background py-8">
      <div className="grid h-full min-h-[38rem] grid-cols-[320px_1fr] overflow-hidden rounded-2xl border bg-card">
        <aside className="min-h-0 overflow-hidden border-r">
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b p-3">
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2 rounded-xl border p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-24 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <Skeleton className="h-10 w-64 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-72 rounded-2xl" />
            <Skeleton className="h-10 w-60 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-80 rounded-2xl" />
            <Skeleton className="h-10 w-56 rounded-2xl" />
          </div>

          <div className="shrink-0 border-t bg-background px-4 py-3">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  );
}
