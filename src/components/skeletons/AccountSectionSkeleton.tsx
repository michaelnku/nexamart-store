import { Skeleton } from "@/components/ui/skeleton";
import SettingsCard from "@/components/settings/SettingsCard";

export default function AccountSectionSkeleton() {
  return (
    <SettingsCard title="Account Information">
      <div className="space-y-4">
        <div>
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>

        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </SettingsCard>
  );
}
