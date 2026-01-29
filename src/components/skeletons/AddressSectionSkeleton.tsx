import { Skeleton } from "@/components/ui/skeleton";
import SettingsCard from "@/components/settings/SettingsCard";

export default function AddressSectionSkeleton() {
  return (
    <SettingsCard title="Addresses">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-14 w-full rounded-md mt-6" />
    </SettingsCard>
  );
}
