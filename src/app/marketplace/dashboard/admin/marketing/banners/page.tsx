import HeroBannerForm from "@/app/marketplace/_components/HeroBannerForm";
import { Button } from "@/components/ui/button";
import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HeroBannerWithFiles } from "@/lib/types";
import { mapHeroBanners } from "@/lib/mappers/heroBanners";

export default async function Page() {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const bannersRaw = await prisma.heroBanner.findMany({
    where: { isDeleted: false },
    orderBy: { position: "asc" },
  });

  const banners = mapHeroBanners(bannersRaw);

  return (
    <div className="space-y-10 p-8">
      <HeroBannerForm banners={banners} />

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
