"use client";

import { FullProduct } from "@/lib/types";
import ProductCard from "./ProductCard";

type ProductGridProps = {
  products: FullProduct[];
};

const ProductGrid = ({ products }: ProductGridProps) => {
  if (!products || products.length === 0) {
    return (
      <div className="py-32 text-center text-gray-500 text-lg">
        No products found.
      </div>
    );
  }

  return (
    <div
      className="
      grid p-6 gap-8 
      sm:grid-cols-2 
      md:grid-cols-2 
      xl:grid-cols-4
      2xl:grid-cols-5
    "
    >
      {products.map((product) => (
        <ProductCard key={product.id} productData={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
