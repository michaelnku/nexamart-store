"use client";

import { useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SearchInput } from "./SearchInput";
import { useGlobalSearch } from "./useGlobalSearch";
import { SearchResultsDropdown } from "./SearchResults";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type MobileSearchSheetProps = {
  variant?: "site" | "marketplace";
};

export function MobileSearchSheet({
  variant = "site",
}: MobileSearchSheetProps) {
  const search = useGlobalSearch(10);

  useEffect(() => {
    if (!search.open) {
      search.setQuery("");
    }
  }, [search.open, search]);

  return (
    <Sheet open={search.open} onOpenChange={search.setOpen}>
      {/* SEARCH ICON */}
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Search className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      {/* FULL SCREEN SEARCH */}
      <SheetContent side="top" className="h-screen p-4">
        {/* ✅ REQUIRED FOR ACCESSIBILITY */}
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Search products</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* INPUT */}
          <SearchInput
            variant={variant}
            value={search.query}
            onChange={search.setQuery}
            onFocus={() => search.setOpen(true)}
            onSubmit={search.submitSearch}
          />

          {/* RESULTS */}
          {search.query.length >= 2 && (
            <div className="max-h-[70vh] overflow-y-auto border rounded-xl p-2">
              <SearchResultsDropdown
                results={search.results}
                isLoading={search.isLoading}
                activeIndex={search.activeIndex}
                setActiveIndex={search.setActiveIndex}
                onSelect={() => search.setOpen(false)}
              />
            </div>
          )}

          {/* EMPTY STATE */}
          {search.query.length < 2 && (
            <p className="text-sm text-gray-500 text-center mt-10">
              Start typing to search products
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
