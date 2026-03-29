import SitePageShell from "../_components/SitePageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryPageLoading() {
  return (
    <SitePageShell className="max-w-6xl space-y-10 px-6 py-6">
      {/* Page title */}
      <Skeleton className="h-7 w-56" />

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border flex flex-col items-center text-center space-y-3"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </SitePageShell>
  );
}
