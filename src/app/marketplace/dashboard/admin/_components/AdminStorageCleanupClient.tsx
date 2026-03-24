"use client";

import { useState, useTransition } from "react";
import {
  HardDrive,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { cleanupOrphanedUploadThingImagesAction } from "@/actions/admin/cleanupOrphanedUploadThingImages";
import {
  DashboardHero,
  PremiumPanel,
  PremiumStatCard,
} from "@/app/marketplace/_components/PremiumDashboard";
import { Button } from "@/components/ui/button";
import { formatAnalyticsCount } from "@/lib/analytics/format";

type ScanState = {
  orphanedKeys: string[];
  scanned: number;
  referenced: number;
  orphaned: number;
};

export default function AdminStorageCleanupClient() {
  const [scanState, setScanState] = useState<ScanState | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [isScanning, startScanTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const orphanedCount = scanState?.orphaned ?? 0;

  const handleScan = () => {
    startScanTransition(async () => {
      try {
        const result = await cleanupOrphanedUploadThingImagesAction({
          dryRun: true,
        });

        setHasScanned(true);
        setScanState({
          orphanedKeys: result.orphanedKeys,
          scanned: result.scanned,
          referenced: result.referenced,
          orphaned: result.orphaned,
        });
        setLastActionMessage(result.message);
        toast.success(result.message);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to scan UploadThing storage.";

        setHasScanned(false);
        setScanState(null);
        setLastActionMessage(message);
        toast.error(message);
      }
    });
  };

  const handleDelete = () => {
    if (!scanState || scanState.orphanedKeys.length === 0) {
      toast.error("Run a scan and make sure orphaned images were found first.");
      return;
    }

    startDeleteTransition(async () => {
      try {
        const result = await cleanupOrphanedUploadThingImagesAction({
          dryRun: false,
          maxDeletes: scanState.orphanedKeys.length,
          keysToDelete: scanState.orphanedKeys,
        });

        setScanState({
          orphanedKeys: [],
          scanned: scanState.scanned,
          referenced: scanState.referenced,
          orphaned: 0,
        });
        setLastActionMessage(result.message);
        toast.success(result.message);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete orphaned UploadThing images.";

        setLastActionMessage(message);
        toast.error(message);
      }
    });
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="System Monitoring"
        title="Storage Cleanup"
        description="Scan UploadThing storage for orphaned images across persisted admin, catalog, account, dispute, and marketing records before deleting the scanned set."
        accentClassName="bg-[linear-gradient(135deg,#111827_0%,#0f3d5e_44%,#0f766e_100%)]"
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PremiumStatCard
          title="Scanned Files"
          value={formatAnalyticsCount(scanState?.scanned ?? 0)}
          description="Image files inspected during the most recent storage scan."
          icon={Search}
          tintClassName="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"
        />
        <PremiumStatCard
          title="Referenced Files"
          value={formatAnalyticsCount(scanState?.referenced ?? 0)}
          description="Persisted UploadThing references found across the current codebase schema."
          icon={HardDrive}
          tintClassName="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        />
        <PremiumStatCard
          title="Orphaned Files"
          value={formatAnalyticsCount(orphanedCount)}
          description={
            hasScanned
              ? "This count is what will be deleted if you run the delete step."
              : "Run the scan first to see how many orphaned files are available."
          }
          icon={ShieldAlert}
          tintClassName="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
        />
      </section>

      <PremiumPanel
        title="Cleanup Controls"
        description="Scan first, review the orphaned count, then delete only the scanned orphaned images."
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleScan} disabled={isScanning || isDeleting}>
              <Search />
              {isScanning ? "Scanning..." : "Scan orphaned images"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                !hasScanned || orphanedCount === 0 || isScanning || isDeleting
              }
            >
              <Trash2 />
              {isDeleting
                ? "Deleting..."
                : `Delete scanned orphaned images (${formatAnalyticsCount(orphanedCount)})`}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
              {hasScanned
                ? `Ready to delete ${formatAnalyticsCount(orphanedCount)} scanned orphaned image(s).`
                : "Delete is disabled until a scan has been completed."}
            </p>
            {lastActionMessage ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                {lastActionMessage}
              </p>
            ) : null}
          </div>
        </div>
      </PremiumPanel>
    </main>
  );
}
