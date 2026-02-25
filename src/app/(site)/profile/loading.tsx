import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-2 h-4 w-72" />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <Skeleton className="h-5 w-16" />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:w-52" />
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>
        </section>
      </div>
    </main>
  );
}
