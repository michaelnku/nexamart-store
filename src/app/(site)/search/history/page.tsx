import {
  getUserRecentSearches,
  getTrendingSearches,
} from "@/actions/search/search";
import Link from "next/link";

export default async function SearchHistoryPage() {
  const [recent, trending] = await Promise.all([
    getUserRecentSearches(8),
    getTrendingSearches(10),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 text-slate-950 dark:text-zinc-100">
      <h1 className="text-2xl font-semibold">Search History</h1>

      {/* RECENT SEARCHES */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-zinc-400">
          Recent Searches
        </h2>

        {recent.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            No recent searches
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={`/search?q=${encodeURIComponent(item.query)}`}
                className="rounded-full bg-muted px-3 py-1 text-sm transition hover:bg-muted/70 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                {item.query}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* TRENDING SEARCHES */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-zinc-400">
          Trending Searches
        </h2>

        <div className="flex flex-wrap gap-2">
          {trending.map((item) => (
            <Link
              key={item.id}
              href={`/search?q=${encodeURIComponent(item.keyword)}`}
              className="px-3 py-1 rounded-full bg-[var(--brand-blue-light)] text-[var(--brand-blue)] text-sm hover:opacity-80 transition"
            >
              {item.keyword}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
