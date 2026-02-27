import HeroBannerForm from "@/app/marketplace/_components/HeroBannerForm";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const banners = await prisma.heroBanner.findMany({
    where: { isDeleted: false },
    orderBy: { position: "asc" },
  });

  return (
    <div className="space-y-10 p-8">
      <HeroBannerForm />

      <div className="space-y-4">
        {banners.map((banner) => (
          <div key={banner.id} className="border p-4 rounded-xl">
            <h2 className="font-semibold">{banner.title}</h2>
            <p className="text-sm text-muted-foreground">
              Active: {banner.isActive ? "Yes" : "No"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
