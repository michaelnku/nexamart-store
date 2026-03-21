import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  getModerationIncidentOverview,
  getModerationIncidents,
} from "@/lib/moderation/getModerationIncidents";
import { parseModerationIncidentSearchParams } from "@/lib/moderation/query";
import { ModeratorIncidentsContent } from "./_components/ModeratorIncidentsContent";

export const dynamic = "force-dynamic";

const styles = {
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ModeratorIncidentsPage(props: {
  searchParams: SearchParams;
}) {
  await requireModerator();
  const filters = parseModerationIncidentSearchParams(
    await props.searchParams,
  );

  const [incidentsResult, overview] = await Promise.all([
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

      <ModeratorIncidentsContent
        data={{ incidents: incidentsResult, overview }}
        filters={filters}
      />
    </div>
  );
}
