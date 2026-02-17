"use client";

import { useEffect, useState } from "react";
import { getRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductCardType } from "@/lib/types";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import RecentlyViewedPaginationSwiper from "./RecentlyViewedPaginationSwiper";

export default function RecentlyViewedRow() {
  const [products, setProducts] = useState<ProductCardType[]>([]);

  useEffect(() => {
    const load = () => {
      const ids = getRecentlyViewed();
      if (!ids.length) {
        setProducts([]);
        return;
      }

      fetch(`/api/products/recent?ids=${ids.join(",")}`)
        .then((res) => res.json())
        .then((data: ProductCardType[]) => {
          const ordered = ids
            .map((id) => data.find((p) => p.id === id))
            .filter(Boolean) as ProductCardType[];

          setProducts(ordered);
        })
        .catch(() => {});
    };

    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (!products.length) return null;

  return (
    <section className="py-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recently Viewed</h2>

          <Link
            href="/customer/history"
            className="flex items-center text-sm font-medium text-[var(--brand-blue)] hover:underline"
          >
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <RecentlyViewedPaginationSwiper products={products} />
      </div>
    </section>
  );
}
