"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { globalSearchAction, recordSearchAction } from "@/actions/search";
import { GlobalSearchResult } from "@/lib/types";
import { saveLocalSearch } from "@/lib/search/searchHistory";

export function useGlobalSearch(limit = 8) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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
        limit,
        cursor: null,
      });

      setResults(res);
      setIsLoading(false);
      setActiveIndex(-1);
    }, 300);

    return () => clearTimeout(t);
  }, [query, limit]);

  const submitSearch = (productId?: string) => {
    saveLocalSearch(query);
    recordSearchAction(query);

    if (productId) {
      router.push(`/product/${productId}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }

    setOpen(false);
  };

  return {
    query,
    setQuery,
    results,
    open,
    setOpen,
    isLoading,
    activeIndex,
    setActiveIndex,
    submitSearch,
  };
}
