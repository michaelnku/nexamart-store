"use client";

import { GlobalSearchResult } from "@/lib/types";
import SearchSkeleton from "../skeletons/SearchSkeleton";
import { SearchResultCard } from "./SearchResultCard";
import StoreResultCard from "./StoreResultCard";
import CategoryResultCard from "./CategoryResultCard";

type Props = {
  results: GlobalSearchResult | null;
  isLoading: boolean;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onSelect: () => void;
};

export function SearchResultsDropdown({
  results,
  isLoading,
  activeIndex,
  setActiveIndex,
  onSelect,
}: Props) {
  if (isLoading) {
    return <SearchSkeleton />;
  }

  if (!results || results.products.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">No results found</p>
    );
  }

  const products = results.products ?? [];
  const stores = results.stores ?? [];
  const categories = results.categories ?? [];

  const productOffset = 0;
  const storeOffset = products.length;
  const categoryOffset = products.length + stores.length;

  if (products.length === 0 && stores.length === 0 && categories.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">No results found</p>
    );
  }

  return (
    <div className="space-y-1">
      {/* PRODUCTS */}
      {products.length > 0 && (
        <Section title="Products">
          {products.map((product, i) => {
            const index = productOffset + i;
            return (
              <SearchResultCard
                key={product.id}
                product={product}
                active={index === activeIndex}
                onHover={() => setActiveIndex(index)}
                onClick={onSelect}
              />
            );
          })}
        </Section>
      )}

      {/* STORES */}
      {stores.length > 0 && (
        <Section title="Stores">
          {stores.map((store, i) => {
            const index = storeOffset + i;
            return (
              <StoreResultCard
                key={store.id}
                store={store}
                active={index === activeIndex}
                onHover={() => setActiveIndex(index)}
                onClick={onSelect}
              />
            );
          })}
        </Section>
      )}

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <Section title="Categories">
          {categories.map((category, i) => {
            const index = categoryOffset + i;
            return (
              <CategoryResultCard
                key={category.id}
                category={category}
                active={index === activeIndex}
                onHover={() => setActiveIndex(index)}
                onClick={onSelect}
              />
            );
          })}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
