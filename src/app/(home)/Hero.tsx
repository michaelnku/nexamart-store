import { prisma } from "@/lib/prisma";
import { getStructuredCategories } from "../../components/helper/getCategories";
import CategoryMiniList from "../../components/home/CategoryMiniList";
import HeroBanner from "../../components/home/HeroBanner";
import { ScrollReveal } from "../../components/animations/ScrollReveal";

export default async function Hero() {
  const categories = await getStructuredCategories();

  const banners = await prisma.heroBanner.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      placement: "HOMEPAGE",
      OR: [
        { startsAt: null, endsAt: null },
        {
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
      ],
    },
    orderBy: { position: "asc" },
  });

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
