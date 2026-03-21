import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  getUserReportOverview,
  getUserReports,
} from "@/lib/moderation/getUserReports";
import { parseModerationReportSearchParams } from "@/lib/moderation/reportsQuery";
import { ModeratorReportsContent } from "./_components/ModeratorReportsContent";

export const dynamic = "force-dynamic";

const styles = {
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ModeratorReportsPage(props: {
  searchParams: SearchParams;
}) {
  await requireModerator();
  const filters = parseModerationReportSearchParams(await props.searchParams);

  const [reportsResult, overview] = await Promise.all([
    getUserReports(filters),
    getUserReportOverview(filters),
  ]);

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="space-y-2">
        <span className={styles.eyebrow}>Moderator Reports</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Reports</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Community-submitted reports across users, products, stores,
            messages, and orders.
          </p>
        </div>
      </div>

      <ModeratorReportsContent
        data={{ reports: reportsResult, overview }}
        filters={filters}
      />
    </div>
  );
}
