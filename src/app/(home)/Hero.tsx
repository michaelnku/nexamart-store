import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { getStructuredCategories } from "@/components/helper/getCategories";
import CategoryMiniList from "@/components/home/CategoryMiniList";
import HeroBanner from "@/components/home/HeroBanner";
import { mapHeroBanners } from "@/lib/mappers/heroBanners";
import { heroBannerMediaInclude } from "@/lib/media-views";
import { prisma } from "@/lib/prisma";

export default async function Hero() {
  const categories = await getStructuredCategories();

  const now = new Date();

  const bannersRaw = await prisma.heroBanner.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      placement: "HOMEPAGE",
      OR: [
        {
          AND: [{ startsAt: null }, { endsAt: null }],
        },
        {
          AND: [{ startsAt: { lte: now } }, { endsAt: { gte: now } }],
        },
      ],
    },
    include: heroBannerMediaInclude,
    orderBy: { position: "asc" },
  });

  const banners = mapHeroBanners(bannersRaw).filter(
    (banner) => !!banner.backgroundImage?.url,
  );

  return (
    <section className="space-y-3 lg:space-y-0">
      <div className="grid gap-3 lg:min-h-[320px] lg:grid-cols-[260px_1fr] lg:gap-4">
        <ScrollReveal className="order-2 lg:order-1" y={20} delay={0.06}>
          <CategoryMiniList categories={categories} />
        </ScrollReveal>

        <ScrollReveal
          className="order-1 lg:order-2"
          y={24}
          duration={0.7}
          amount={0.2}
        >
          <HeroBanner banners={banners} />
        </ScrollReveal>
      </div>
    </section>
  );
}
