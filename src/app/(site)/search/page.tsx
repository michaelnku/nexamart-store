import {
  getTrendingSearches,
  getUserRecentSearches,
  globalSearchAction,
} from "@/actions/search/search";
import CategoryResultCard from "@/components/search/CategoryResultCard";
import { SearchChip } from "@/components/search/SearchChip";
import SearchEmptyState from "@/components/search/SearchEmptyState";
import SearchResultsGrid from "@/components/search/SearchResultsGrid";
import StoreResultCard from "@/components/search/StoreResultCard";
import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo/seo.metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Search",
  description: "Search products, stores, and categories across NexaMart.",
  path: "/search",
});

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (await searchParams).q?.trim() || "";

  const [trending, recent] = await Promise.all([
    getTrendingSearches(),
    getUserRecentSearches(),
  ]);

  if (!query) {
    return (
      <main className="mx-auto min-h-full max-w-7xl space-y-8 px-4 py-10 text-slate-950 dark:text-zinc-100">
        <section>
          <h2 className="font-semibold mb-3">Trending searches</h2>
          <div className="flex flex-wrap gap-2">
            {trending.map((t) => (
              <SearchChip key={t.keyword} label={t.keyword} />
            ))}
          </div>
        </section>

        {recent.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3">Recent searches</h2>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <SearchChip key={r.id} label={r.query} />
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }

  if (query.length < 2) {
    return (
      <div className="mx-auto min-h-full max-w-7xl py-10 text-center">
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Please enter at least 2 characters to search.
        </p>
      </div>
    );
  }

  const results = await globalSearchAction({
    query,
    limit: 24,
    cursor: null,
  });

  const stores = results.stores ?? [];
  const categories = results.categories ?? [];

  return (
    <main className="mx-auto min-h-full max-w-7xl space-y-6 px-4 py-10 text-slate-950 dark:text-zinc-100">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">
          Search results for{" "}
          <span className="text-[var(--brand-blue)]">
            &ldquo;{query}&rdquo;
          </span>
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          {results.products.length} products found
        </p>
      </div>

      {/* STORES */}
      {stores.length > 0 && (
        <section>
          <h2 className="font-semibold mb-4">Stores</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stores.map((store) => (
              <StoreResultCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section>
          <h2 className="font-semibold mb-4">Categories</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryResultCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/*Product RESULTS */}
      {results.products.length === 0 ? (
        <SearchEmptyState query={query} />
      ) : (
        <SearchResultsGrid products={results.products} />
      )}
    </main>
  );
}
