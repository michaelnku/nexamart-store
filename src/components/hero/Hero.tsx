import { getStructuredCategories } from "../helper/getCategories";
import CategoryMiniList from "../home/CategoryMiniList";
import HeroBanner from "../home/HeroBanner";

const Hero = async () => {
  const categories = await getStructuredCategories();
  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4
                      min-h-[240px]
  "
    >
      <CategoryMiniList categories={categories} />
      <HeroBanner />
    </section>
  );
};

export default Hero;
