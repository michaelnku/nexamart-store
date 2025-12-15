import { globalSearchAction } from "@/actions/search";
import Image from "next/image";
import Link from "next/link";

type SearchPageProps = {
  searchParams: {
    q?: string;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() || "";

  if (query.length < 2) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
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

      {/* RESULTS */}
      {results.products.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {results.products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group border rounded-xl bg-white shadow-sm hover:shadow-md transition"
            >
              {/* IMAGE */}
              <div className="relative aspect-square bg-gray-50 rounded-t-xl overflow-hidden">
                {product.images[0] && (
                  <Image
                    src={product.images[0].imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition"
                  />
                )}
              </div>

              {/* INFO */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium line-clamp-2">
                  {product.name}
                </p>

                <p className="text-xs text-gray-500">
                  Sold by {product.store.name}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="border rounded-xl bg-white p-10 text-center space-y-2">
      <p className="text-lg font-medium">No results found</p>
      <p className="text-sm text-gray-500">
        We couldn’t find anything for “{query}”
      </p>
    </div>
  );
}
