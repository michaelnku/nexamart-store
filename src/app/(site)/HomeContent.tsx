import ProductRow from "@/components/home/ProductRow";
import { CurrentUser } from "@/lib/currentUser";
import { Suspense } from "react";
import ProductRowSkeleton from "@/components/skeletons/ProductRowSkeleton";
import Hero from "@/app/(home)/Hero";
import ShopByBudget from "@/components/home/ShopByBudget";
import FeaturedCollections from "@/components/home/FeaturedCollections";
import RecentlyViewedRow from "@/components/home/RecentlyViewedRow";
import RecommendedPreviewRow from "@/components/home/RecommendedPreviewRow";
import TopRatedProductRow from "@/components/home/TopRatedProductRow";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { HowNexaMartWorksSection } from "@/components/home/HowNexaMartWorksSection";

export default async function HomeContent() {
  const user = await CurrentUser();

  return (
    <>
      <ScrollReveal y={26} duration={0.7} amount={0.15}>
        <Hero />
      </ScrollReveal>

      <div className="h-px bg-border my-6" />

      <ScrollReveal delay={0.03}>
        <section id="new-arrivals" className="scroll-mt-24">
          <Suspense fallback={<ProductRowSkeleton title="New Arrivals" />}>
            <ProductRow title="New Arrivals" type="new" autoplay />
          </Suspense>
        </section>
      </ScrollReveal>

      <div className="h-px bg-border my-6" />

      <ScrollReveal delay={0.05}>
        <section id="deals-and-discounts" className="scroll-mt-24">
          <Suspense fallback={<ProductRowSkeleton title="Deals & Discounts" />}>
            <ProductRow
              title="Deals & Discounts"
              type="discounts"
              autoplay={false}
            />
          </Suspense>
        </section>
      </ScrollReveal>

      <div className="h-px bg-border my-6" />

      <ScrollReveal delay={0.07}>
        <FeaturedCollections />
      </ScrollReveal>

      <section id="recently-viewed" className="scroll-mt-24">
        {user && (
          <ScrollReveal delay={0.06}>
            <div className="h-px bg-border my-6" />
            <Suspense fallback={null}>
              <RecentlyViewedRow />
            </Suspense>
          </ScrollReveal>
        )}
      </section>

      <ScrollReveal delay={0.08}>
        <section id="trending-now" className="scroll-mt-24">
          <Suspense fallback={<ProductRowSkeleton title="Trending Now" />}>
            <ProductRow title="Trending Now" type="trending" autoplay={false} />
          </Suspense>
        </section>
      </ScrollReveal>

      <section id="recommended-for-you" className="scroll-mt-24">
        {user && (
          <ScrollReveal delay={0.1}>
            <div className="h-px bg-border my-6" />
            <Suspense
              fallback={
                <ProductRowSkeleton
                  title="Recommended For You"
                  showExplore={false}
                />
              }
            >
              <RecommendedPreviewRow />
            </Suspense>
          </ScrollReveal>
        )}
      </section>

      <div className="h-px bg-border my-6" />

      <ScrollReveal delay={0.04}>
        <ShopByBudget />
      </ScrollReveal>

      <div className="h-px bg-border my-6" />

      <ScrollReveal delay={0.09}>
        <section id="top-rated" className="scroll-mt-24">
          <Suspense fallback={<ProductRowSkeleton title="Top Rated" />}>
            <TopRatedProductRow />
          </Suspense>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.11}>
        <section className="scroll-mt-24">
          <HowNexaMartWorksSection />
        </section>
      </ScrollReveal>
    </>
  );
}
