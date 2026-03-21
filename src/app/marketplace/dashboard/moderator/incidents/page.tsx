import { AlertTriangle, ShieldAlert, Siren } from "lucide-react";
import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  getModerationIncidentOverview,
  getModerationIncidents,
} from "@/lib/moderation/getModerationIncidents";
import { parseModerationIncidentSearchParams } from "@/lib/moderation/query";
import { IncidentFilters } from "./_components/IncidentFilters";
import { IncidentsTable } from "./_components/IncidentsTable";

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function MetricCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: typeof AlertTriangle;
}) {
  return (
    <div className={`${styles.premiumSurface} min-w-0 p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
            {label}
          </p>
          <h2
            className={`min-w-0 break-words text-xl font-bold leading-tight tracking-tight sm:text-2xl ${accent}`}
          >
            {value.toLocaleString()}
          </h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 p-3 text-[#3c9ee0] dark:border-[#3c9ee0]/20 dark:bg-[#3c9ee0]/12">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function ModeratorIncidentsPage(props: {
  searchParams: SearchParams;
}) {
  await requireModerator();
  const filters = parseModerationIncidentSearchParams(
    await props.searchParams,
  );

  const [incidents, overview] = await Promise.all([
    getModerationIncidents(filters),
    getModerationIncidentOverview(filters),
  ]);

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="space-y-2">
        <span className={styles.eyebrow}>Moderator Queue</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Unified moderation queue for AI and human-generated incidents.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Open Incidents"
          value={overview.openCount}
          accent="text-[var(--brand-blue)]"
          icon={AlertTriangle}
        />
        <MetricCard
          label="Pending Human Review"
          value={overview.pendingReviewCount}
          accent="text-amber-600"
          icon={ShieldAlert}
        />
        <MetricCard
          label="Critical Cases"
          value={overview.criticalCount}
          accent="text-red-600"
          icon={Siren}
        />
      </div>

      <IncidentFilters />
      <IncidentsTable incidents={incidents} />
    </div>
  );
}
