import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { getStructuredCategories } from "@/components/helper/getCategories";
import CategoryMiniList from "@/components/home/CategoryMiniList";
import HeroBanner from "@/components/home/HeroBanner";
import { prisma } from "@/lib/prisma";
import { HeroBannerWithFiles } from "@/lib/types";

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
    orderBy: { position: "asc" },
  });

  // Properly type JSON fields
  const banners: HeroBannerWithFiles[] = bannersRaw.map((banner) => ({
    ...banner,
    backgroundImage:
      banner.backgroundImage as HeroBannerWithFiles["backgroundImage"],
    productImage: banner.productImage as HeroBannerWithFiles["productImage"],
  }));

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

// import { getStructuredCategories } from "../helper/getCategories";
// import CategoryMiniList from "../home/CategoryMiniList";
// import HeroBanner from "../home/HeroBanner";
// import { ScrollReveal } from "../animations/ScrollReveal";

// const Hero = async () => {
//   const categories = await getStructuredCategories();
//   return (
//     <section className="space-y-3 lg:space-y-0">
//       <div className="grid gap-3 lg:min-h-[320px] lg:grid-cols-[260px_1fr] lg:gap-4">
//         <ScrollReveal className="order-2 lg:order-1" y={20} delay={0.06}>
//           <CategoryMiniList categories={categories} />
//         </ScrollReveal>

//         <ScrollReveal
//           className="order-1 lg:order-2"
//           y={24}
//           duration={0.7}
//           amount={0.2}
//         >
//           <HeroBanner />
//         </ScrollReveal>
//       </div>
//     </section>
//   );
// };

// export default Hero;
