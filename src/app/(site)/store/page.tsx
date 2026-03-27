import { prisma } from "@/lib/prisma";
import StoresCard from "@/components/store/StoresCard";
import { calculateStoresPrepPerformance } from "@/lib/store/calculateStorePrepPerformance";
import { mapStoreMedia, storeMediaInclude } from "@/lib/media-views";

export default async function StoreDirectoryPage() {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      ...storeMediaInclude,
      _count: { select: { StoreFollower: true } },
    },
  });

  const mapped = stores.map((storeRecord) => {
    const store = mapStoreMedia(storeRecord);

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      logo: store.logo,
      location: store.location,
      tagline: store.tagline,
      followers: storeRecord._count.StoreFollower,
    };
  });

  const performanceByStore = await calculateStoresPrepPerformance(
    mapped.map((store) => store.id),
  );

  const rankedStores = [...mapped].sort((a, b) => {
    const aRate = performanceByStore[a.id]?.onTimeRate ?? 0;
    const bRate = performanceByStore[b.id]?.onTimeRate ?? 0;
    if (bRate !== aRate) return bRate - aRate;
    return (b.followers ?? 0) - (a.followers ?? 0);
  });

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-zinc-100">
          Active Stores
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Browse and discover shops across the marketplace.
        </p>
      </div>

      {mapped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-24 text-center text-muted-foreground dark:border-zinc-800 dark:bg-zinc-950/50">
          No stores yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankedStores.map((store) => (
            <StoresCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </main>
  );
}
