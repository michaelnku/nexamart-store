"use client";

import { useEffect, useState } from "react";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
} from "@/hooks/useRecentlyViewed";
import PublicProductCard from "@/components/product/PublicProductCard";
import { ProductCardType } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const [products, setProducts] = useState<ProductCardType[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    setIsMobile(media.matches);

    const listener = () => setIsMobile(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const ids = getRecentlyViewed();
    if (!ids.length) return;

    fetch(`/api/products/recent?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data: ProductCardType[]) => {
        const ordered = ids
          .map((id) => data.find((p) => p.id === id))
          .filter(Boolean) as ProductCardType[];

        setProducts(isMobile ? ordered.slice(0, 5) : ordered);
      })
      .catch(() => {});
  }, [isMobile]);

  if (!products.length) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-20 text-center text-muted-foreground">
        You haven’t viewed any products yet.
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recently Viewed Products</h1>

        <Button
          variant="outline"
          onClick={() => {
            clearRecentlyViewed();
            setProducts([]);
          }}
        >
          Clear history
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <PublicProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
