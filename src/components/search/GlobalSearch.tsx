"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { globalSearchAction, recordSearchAction } from "@/actions/search";
import { GlobalSearchResult } from "@/lib/types";
import SearchSkeleton from "../skeletons/SearchSkeleton";
import { useRouter } from "next/navigation";
import { SearchInput } from "./SearchInput";
import { saveLocalSearch } from "@/lib/search/searchHistory";
import { createProductSlug } from "@/lib/search/productSlug";

type GlobalSearchProps = {
  variant?: "site" | "marketplace";
};

export function GlobalSearch({ variant = "site" }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const t = setTimeout(async () => {
      const res = await globalSearchAction({
        query,
        limit: 8,
        cursor: null,
      });

      setResults(res);
      setIsLoading(false);
      setActiveIndex(-1);
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = results?.products ?? [];

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      saveLocalSearch(query);
      recordSearchAction(query);
      if (activeIndex >= 0) {
        router.push(`/product/${items[activeIndex].id}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }

      setOpen(false);
    }

    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* INPUT */}
      <SearchInput
        variant={variant}
        value={query}
        onChange={setQuery}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onSubmit={() => {
          if (query.trim().length >= 2) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setOpen(false);
          }
        }}
      />

      {/* DROPDOWN */}
      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border z-50">
          <div className="p-3 max-h-[420px] overflow-y-auto space-y-2">
            {isLoading && <SearchSkeleton />}

            {!isLoading && results && results.products.length > 0 && (
              <Section title="Products">
                {results.products.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/product/${createProductSlug(p.name, p.id)}`}
                    className={`flex gap-3 p-2 rounded transition ${
                      i === activeIndex
                        ? "bg-[var(--brand-blue-light)]"
                        : "hover:bg-muted"
                    }`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => setOpen(false)}
                  >
                    {p.images[0] && (
                      <Image
                        src={p.images[0].imageUrl}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    )}

                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {highlightMatch(p.name, query)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.store.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </Section>
            )}

            {!isLoading && results && results.products.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">
                No results found
              </p>
            )}
          </div>
        </div>
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
      <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, "ig");

  return text.split(regex).map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className="bg-[var(--brand-blue-light)] text-[var(--brand-blue)] rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
