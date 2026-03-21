import { requireModerator } from "@/lib/moderation/guardModerator";
import {
  getModeratorProducts,
  getModeratorProductsOverview,
} from "@/lib/moderation/getModeratorProducts";
import { parseModeratorProductsSearchParams } from "@/lib/moderation/productsQuery";
import { ModeratorProductsContent } from "./_components/ModeratorProductsContent";

export const dynamic = "force-dynamic";

const styles = {
  eyebrow:
    "inline-flex w-fit items-center rounded-full border border-[#3c9ee0]/15 bg-[#3c9ee0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c7fb8] dark:border-[#3c9ee0]/25 dark:bg-[#3c9ee0]/12 dark:text-[#7fc6f5]",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ModeratorProductsPage(props: {
  searchParams: SearchParams;
}) {
  await requireModerator();
  const filters = parseModeratorProductsSearchParams(await props.searchParams);

  const [products, overview] = await Promise.all([
    getModeratorProducts(filters),
    getModeratorProductsOverview(filters),
  ]);

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="space-y-2">
        <span className={styles.eyebrow}>Moderator Products</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Moderation
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review listing visibility, product risk signals, and linked
            moderation incidents.
          </p>
        </div>
      </div>

      <ModeratorProductsContent
        data={{ products, overview }}
        filters={filters}
      />
    </div>
  );
}
