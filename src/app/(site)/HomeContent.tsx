import ProductRow from "@/components/home/ProductRow";
import { CurrentUser } from "@/lib/currentUser";
import { Suspense } from "react";
import ProductRowSkeleton from "@/components/skeletons/ProductRowSkeleton";
import Hero from "@/components/hero/Hero";
import ShopByBudget from "@/components/home/ShopByBudget";
import FeaturedCollections from "@/components/home/FeaturedCollections";
import RecentlyViewedRow from "@/components/home/RecentlyViewedRow";
import RecommendedPreviewRow from "@/components/home/RecommendedPreviewRow";
import TopRatedProductRow from "@/components/home/TopRatedProductRow";
export default async function HomeContent() {
  const user = await CurrentUser();

  return (
    <>
      <Hero />

      <div className="h-px bg-border my-6" />

      <section id="new-arrivals" className="scroll-mt-24">
        <Suspense fallback={<ProductRowSkeleton title="New Arrivals" />}>
          <ProductRow title="New Arrivals" type="New" autoplay />
        </Suspense>
      </section>

      <div className="h-px bg-border my-6" />

      <ShopByBudget />

      <section id="recently-viewed" className="scroll-mt-24">
        {user && (
          <>
            <div className="h-px bg-border my-6" />
            <Suspense fallback={null}>
              <RecentlyViewedRow />
            </Suspense>
          </>
        )}
      </section>

      <div className="h-px bg-border my-6" />

      <FeaturedCollections />

      <div className="h-px bg-border my-6" />

      <section id="trending-now" className="scroll-mt-24">
        <Suspense fallback={<ProductRowSkeleton title="Trending Now" />}>
          <ProductRow title="Trending Now" type="Trending" autoplay={false} />
        </Suspense>
      </section>

      <div className="h-px bg-border my-6" />

      <section id="top-rated" className="scroll-mt-24">
        <Suspense fallback={<ProductRowSkeleton title="Top Rated" />}>
          <TopRatedProductRow />
        </Suspense>
      </section>

      <div className="h-px bg-border my-6" />

      <section id="deals-and-discounts" className="scroll-mt-24">
        <Suspense fallback={<ProductRowSkeleton title="Deals & Discounts" />}>
          <ProductRow
            title="Deals & Discounts"
            type="Discounts"
            autoplay={false}
          />
        </Suspense>
      </section>

      <section id="recommended-for-you" className="scroll-mt-24">
        {user && (
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
        )}
      </section>
    </>
  );
}
