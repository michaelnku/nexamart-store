"use client";

import { useRef } from "react";
import { SearchInput } from "./SearchInput";
import { useGlobalSearch } from "./useGlobalSearch";
import { SearchResultsDropdown } from "./SearchResults";

export function MarketplaceSearch() {
  const ref = useRef<HTMLDivElement>(null);
  const search = useGlobalSearch(6);

  return (
    <div ref={ref} className="relative w-full max-w-2xl ">
      <SearchInput
        variant="marketplace"
        value={search.query}
        onChange={search.setQuery}
        onFocus={() => search.setOpen(true)}
        onSubmit={() => search.submitSearch()}
      />

      {search.open && search.query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full light:bg-white dark:bg-neutral-950 rounded-xl shadow-lg border z-50 p-2">
          <SearchResultsDropdown
            results={search.results}
            isLoading={search.isLoading}
            activeIndex={search.activeIndex}
            setActiveIndex={search.setActiveIndex}
            onSelect={() => search.setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
