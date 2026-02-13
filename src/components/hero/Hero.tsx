import { getStructuredCategories } from "../helper/getCategories";
import CategoryMiniList from "../home/CategoryMiniList";
import HeroBanner from "../home/HeroBanner";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";

const Hero = async () => {
  const categories = await getStructuredCategories();
  return (
    <section>
      <div className="lg:hidden">
        <div className="relative">
          <HeroBanner />

          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-end">
            <Link
              href="/category"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:bg-white dark:border-white/20 dark:bg-neutral-900/90 dark:text-white dark:hover:bg-neutral-900"
            >
              <LayoutGrid className="h-4 w-4" />
              All Categories
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden gap-4 lg:grid lg:min-h-[320px] lg:grid-cols-[260px_1fr]">
        <CategoryMiniList categories={categories} />
        <HeroBanner />
      </div>
    </section>
  );
};

export default Hero;
