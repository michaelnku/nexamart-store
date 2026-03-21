import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  getModerationUsers,
  getModerationUsersOverview,
} from "@/lib/moderation/getModerationUsers";
import { parseModerationUsersSearchParams } from "@/lib/moderation/usersQuery";
import { ModeratorUsersContent } from "./_components/ModeratorUsersContent";

export const dynamic = "force-dynamic";

const styles = {
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ModeratorUsersPage(props: {
  searchParams: SearchParams;
}) {
  await requireModerator();
  const filters = parseModerationUsersSearchParams(await props.searchParams);

  const [usersResult, overview] = await Promise.all([
    getModerationUsers(filters),
    getModerationUsersOverview(filters),
  ]);

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="space-y-2">
        <span className={styles.eyebrow}>Moderator Users</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moderate Users</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review moderation state, strike history, restrictions, and user-level
            patterns.
          </p>
        </div>
      </div>

      <ModeratorUsersContent
        data={{ users: usersResult, overview }}
        filters={filters}
      />
    </div>
  );
}
