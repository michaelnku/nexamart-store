import { getStructuredCategories } from "../helper/getCategories";
import CategoryMiniList from "../home/CategoryMiniList";
import HeroBanner from "../home/HeroBanner";

const Hero = async () => {
  const categories = await getStructuredCategories();
  return (
    <section className="space-y-3 lg:space-y-0">
      <div className="grid gap-3 lg:min-h-[320px] lg:grid-cols-[260px_1fr] lg:gap-4">
        <div className="order-2 lg:order-1">
          <CategoryMiniList categories={categories} />
        </div>

        <div className="order-1 lg:order-2">
          <HeroBanner />
        </div>
      </div>
    </section>
  );
};

export default Hero;
