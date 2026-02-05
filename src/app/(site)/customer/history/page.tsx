"use client";

import { useEffect, useState } from "react";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
} from "@/hooks/useRecentlyViewed";
import PublicProductCard from "@/components/product/PublicProductCard";
import { ProductCardType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const [products, setProducts] = useState<ProductCardType[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    setIsMobile(media.matches);

    const listener = () => setIsMobile(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const ids = getRecentlyViewed();
    if (!ids.length) {
      setIsLoading(false);
      return;
    }

    fetch(`/api/products/recent?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data: ProductCardType[]) => {
        const ordered = ids
          .map((id) => data.find((p) => p.id === id))
          .filter(Boolean) as ProductCardType[];

        setProducts(isMobile ? ordered.slice(0, 5) : ordered);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [isMobile]);

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-background overflow-hidden p-3 space-y-3"
            >
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (!products.length) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-20 text-center text-muted-foreground">
        You haven't viewed any products yet.
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
