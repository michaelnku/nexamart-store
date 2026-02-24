import { prisma } from "@/lib/prisma";
import StoresCard from "@/components/store/StoresCard";
import { calculateStoresPrepPerformance } from "@/lib/store/calculateStorePrepPerformance";

export default async function StoreDirectoryPage() {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      location: true,
      tagline: true,
      _count: { select: { StoreFollower: true } },
    },
  });

  const mapped = stores.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    logo: s.logo,
    location: s.location,
    tagline: s.tagline,
    followers: s._count.StoreFollower,
  }));

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
    <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Active Stores</h1>
        <p className="text-sm text-gray-500">
          Browse and discover shops across the marketplace.
        </p>
      </div>

      {mapped.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
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
