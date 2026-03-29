import SitePageShell from "../../_components/SitePageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerReferralsLoading() {
  return (
    <SitePageShell className="max-w-5xl space-y-6 px-6 py-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="rounded-xl border p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-10 w-56 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border p-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-14" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-6">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-3 border-t pt-3 sm:grid-cols-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </SitePageShell>
  );
}
