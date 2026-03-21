import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  getAiModerationQueue,
  getAiModerationQueueOverview,
} from "@/lib/moderation/getAiModerationQueue";
import { parseAiModerationSearchParams } from "@/lib/moderation/aiQuery";
import { ModeratorAiQueueContent } from "./_components/ModeratorAiQueueContent";

export const dynamic = "force-dynamic";

const styles = {
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ModeratorAiReviewQueuePage(props: {
  searchParams: SearchParams;
}) {
  await requireModerator();
  const filters = parseAiModerationSearchParams(await props.searchParams);

  const [incidentsResult, overview] = await Promise.all([
    getAiModerationQueue(filters),
    getAiModerationQueueOverview(filters),
  ]);

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="space-y-2">
        <span className={styles.eyebrow}>Moderator AI Queue</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Review Queue</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Human review workspace for AI-generated moderation decisions and
            escalations.
          </p>
        </div>
      </div>

      <ModeratorAiQueueContent
        data={{ incidents: incidentsResult, overview }}
        filters={filters}
      />
    </div>
  );
}
