import ProductFeed from "@/app/(site)/(store)/(shop)/ProductFeed";
import { Suspense } from "react";
import ProductCardSkeleton from "../product/ProductCardSkeleton";

const ContentPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8 ">🛍️ Shop Products</h1>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ProductFeed />
      </Suspense>
    </div>
  );
};

export default ContentPage;
