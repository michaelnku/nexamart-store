import {
  getTrendingSearches,
  getUserRecentSearches,
  globalSearchAction,
} from "@/actions/search";
import { SearchChip } from "@/components/search/SearchChip";
import SearchEmptyState from "@/components/search/SearchEmptyState";
import SearchResultsGrid from "@/components/search/SearchResultsGrid";

type SearchPageProps = {
  searchParams: {
    q?: string;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() || "";

  const [trending, recent] = await Promise.all([
    getTrendingSearches(),
    getUserRecentSearches(),
  ]);
  if (query.length < 2) {
    return (
      <div className="max-w-7xl min-h-screen text-center mx-auto py-10">
        <p className="text-gray-500 text-sm">
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

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">
          Search results for{" "}
          <span className="text-[var(--brand-blue)]">“{query}”</span>
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          {results.products.length} products found
        </p>
      </div>

      {!query && (
        <>
          <section title="Trending Searches">
            {trending.map((t) => (
              <SearchChip key={t.keyword} label={t.keyword} />
            ))}
          </section>

          <section title="Recent Searches">
            {recent.map((r) => (
              <SearchChip key={r.id} label={r.query} />
            ))}
          </section>
        </>
      )}

      {/* RESULTS */}
      {results.products.length === 0 ? (
        <SearchEmptyState query={query} />
      ) : (
        <SearchResultsGrid products={results.products} />
      )}
    </main>
  );
}
