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
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const [products, setProducts] = useState<ProductCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

        setProducts(ordered);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-7 w-60" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (!products.length) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-24 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Nothing viewed yet</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Products you explore will appear here so you can easily find them
          again.
        </p>

        <Button
          className="bg-[#3c9ee0] hover:bg-[#3187c9] text-white"
          onClick={() => router.push("/")}
        >
          Explore Products
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Recently Viewed</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length > 1 ? "s" : ""} viewed
          </p>
        </div>

        <Button
          variant="ghost"
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => {
            clearRecentlyViewed();
            setProducts([]);
          }}
        >
          Clear history
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {products.map((product) => (
          <PublicProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
