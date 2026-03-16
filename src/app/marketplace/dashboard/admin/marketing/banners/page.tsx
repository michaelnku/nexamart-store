import HeroBannerCreateForm from "@/app/marketplace/_components/HeroBannerCreateForm";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/generated/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HeroBannerWithFiles } from "@/lib/types";
import { mapHeroBanners } from "@/lib/mappers/heroBanners";

export default async function Page() {
  const user = await CurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  const bannersRaw = await prisma.heroBanner.findMany({
    where: { isDeleted: false },
    orderBy: { position: "asc" },
  });

  const banners = mapHeroBanners(bannersRaw);

  return (
    <div className="space-y-10 p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Banner Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage homepage and merchandising banner placements.
          </p>
        </div>

        <Button asChild>
          <Link href="#new-banner">Add New Banner</Link>
        </Button>
      </div>

      <HeroBannerCreateForm />

      <div className="space-y-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="border p-4 rounded-xl flex justify-between"
          >
            <div>
              <h2 className="font-semibold">{banner.title}</h2>
              <p className="text-sm text-muted-foreground">
                Active: {banner.isActive ? "Yes" : "No"}
              </p>
            </div>

            <Button asChild variant="outline">
              <Link
                href={`/marketplace/dashboard/admin/marketing/banners/${banner.id}`}
              >
                Edit
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
