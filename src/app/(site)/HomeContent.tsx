//my homecontent
import ProductRow from "@/components/home/ProductRow";
import { CurrentUser } from "@/lib/currentUser";
import { Suspense } from "react";
import ProductRowSkeleton from "@/components/skeletons/ProductRowSkeleton";
import Hero from "@/components/hero/Hero";
export default async function HomeContent() {
  const user = await CurrentUser();

  return (
    <>
      <Hero />

      <div className="h-px bg-border my-6" />

      <Suspense fallback={<ProductRowSkeleton title="Latest Arrivals" />}>
        <ProductRow title="Latest Arrivals" type="latest" autoplay />
      </Suspense>

      <Suspense fallback={<ProductRowSkeleton title="Top Sellers" />}>
        <ProductRow title="Top Sellers" type="top" autoplay={false} />
      </Suspense>

      <Suspense fallback={<ProductRowSkeleton title="Deals & Discounts" />}>
        <ProductRow
          title="Deals & Discounts"
          type="discounts"
          autoplay={false}
        />
      </Suspense>

      {user && (
        <Suspense fallback={<ProductRowSkeleton title="Recommended For You" />}>
          <ProductRow
            title="Recommended For You"
            type="recommended"
            autoplay={false}
          />
        </Suspense>
      )}
    </>
  );
}
