"use client";

import { SearchProduct } from "@/lib/types";
import { SearchResultCard } from "./SearchResultCard";

type Props = {
  products: SearchProduct[];
};

export default function SearchResultsGrid({ products }: Props) {
  if (products.length === 0) {
    return <p className="text-gray-500 text-center py-10">No products found</p>;
  }

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="border rounded-xl light:bg-white shadow-sm hover:shadow-md transition"
        >
          <SearchResultCard product={product} />
        </div>
      ))}
    </section>
  );
}
