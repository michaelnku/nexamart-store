import SitePageShell from "../_components/SitePageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function SupportLoading() {
  return (
    <SitePageShell className="max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="rounded-xl border shadow-sm">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>

      <div className="rounded-xl border shadow-sm">
        <div className="space-y-4 p-5">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-3 border-t pt-3 md:grid-cols-[1.1fr_1.4fr_0.8fr_1fr_1fr_88px]"
              >
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SitePageShell>
  );
}
