import { prisma } from "@/lib/prisma";
import { CurrentUserId } from "@/lib/currentUser";
import SellersCard from "@/components/store/SellersCard";

export default async function FollowedSellersPage() {
  const userId = await CurrentUserId();

  if (!userId) return null;

  const followed = await prisma.storeFollower.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          location: true,
          tagline: true,
          _count: {
            select: { StoreFollower: true },
          },
        },
      },
    },
  });

  const stores = followed.map((f) => ({
    id: f.store.id,
    name: f.store.name,
    slug: f.store.slug,
    logo: f.store.logo,
    location: f.store.location,
    tagline: f.store.tagline,
    followers: f.store._count.StoreFollower,
  }));

  return (
    <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Followed Sellers</h1>
        <p className="text-sm text-gray-500">
          Stores you follow for updates and new products.
        </p>
      </div>

      {stores.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          You haven't followed any sellers yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <SellersCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </main>
  );
}
