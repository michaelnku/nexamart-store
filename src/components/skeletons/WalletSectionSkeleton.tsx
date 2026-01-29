import { Skeleton } from "@/components/ui/skeleton";
import SettingsCard from "@/components/settings/SettingsCard";

export default function WalletSectionSkeleton() {
  return (
    <SettingsCard title="Wallet">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="flex gap-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>

        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </SettingsCard>
  );
}
