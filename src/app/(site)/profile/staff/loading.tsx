import { Skeleton } from "@/components/ui/skeleton";

export default function StaffProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <section className="rounded-xl border bg-white p-6 dark:bg-neutral-900">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="mt-8 space-y-5">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-9 w-44" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <Skeleton className="h-10 w-52" />
        </div>
      </section>
    </main>
  );
}
