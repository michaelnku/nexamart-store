import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <main className="h-full min-h-0 w-full mx-auto max-w-6xl bg-background overflow-hidden">
      <div className="grid h-full min-h-0 grid-cols-[320px_1fr] overflow-hidden">
        <aside className="border-r h-full min-h-0 overflow-hidden">
          <div className="h-full min-h-0 flex flex-col">
            <div className="shrink-0 border-b p-3">
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="shrink-0 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </aside>

        <section className="h-full min-h-0 flex flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-72 ml-auto" />
            <Skeleton className="h-10 w-60" />
            <Skeleton className="h-10 w-80 ml-auto" />
            <Skeleton className="h-10 w-56" />
          </div>

          <div className="shrink-0 border-t bg-background px-4 py-3">
            <Skeleton className="h-10 w-full" />
          </div>
        </section>
      </div>
    </main>
  );
}
