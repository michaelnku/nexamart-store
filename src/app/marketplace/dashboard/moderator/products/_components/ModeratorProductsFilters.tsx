"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductFilterState = {
  query: string;
  published: string;
  foodType: string;
  // flagged: string;
};

function readFilterState(
  searchParams: ReturnType<typeof useSearchParams>,
): ProductFilterState {
  return {
    query: searchParams.get("q") ?? "",
    published: searchParams.get("published") ?? "ALL",
    foodType: searchParams.get("foodType") ?? "ALL",
    flagged: searchParams.get("flagged") ?? "ALL",
  };
}

export function ModeratorProductsFilters(props: {
  isPending: boolean;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ProductFilterState>(() =>
    readFilterState(searchParams),
  );

  useEffect(() => {
    setFilters(readFilterState(searchParams));
  }, [searchParams]);

  const navigate = (nextState: ProductFilterState) => {
    const nextParams = new URLSearchParams();

    if (nextState.query.trim()) {
      nextParams.set("q", nextState.query.trim());
    }

    if (nextState.published !== "ALL") {
      nextParams.set("published", nextState.published);
    }

    if (nextState.foodType !== "ALL") {
      nextParams.set("foodType", nextState.foodType);
    }

    if (nextState.flagged !== "ALL") {
      nextParams.set("flagged", nextState.flagged);
    }

    const next = nextParams.toString();
    props.onNavigate(next ? `${pathname}?${next}` : pathname);
  };

  const updateFilter = <K extends keyof ProductFilterState>(
    key: K,
    value: ProductFilterState[K],
  ) => {
    const nextState = { ...filters, [key]: value };
    setFilters(nextState);
    navigate(nextState);
  };

  const applySearch = () => {
    navigate(filters);
  };

  const clearFilters = () => {
    const nextState: ProductFilterState = {
      query: "",
      published: "ALL",
      foodType: "ALL",
      flagged: "ALL",
    };
    setFilters(nextState);
    props.onNavigate(pathname);
  };

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.published !== "ALL" ||
    filters.foodType !== "ALL" ||
    filters.flagged !== "ALL";

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
        <div className="sm:col-span-2 xl:col-span-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search product, brand, store..."
                value={filters.query}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    query: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySearch();
                  }
                }}
                disabled={props.isPending}
              />
            </div>

            <Button
              type="button"
              onClick={applySearch}
              disabled={props.isPending}
              className="shrink-0"
            >
              Search
            </Button>
          </div>
        </div>

        <div className="xl:col-span-3">
          <Select
            value={filters.published}
            onValueChange={(value) => updateFilter("published", value)}
            disabled={props.isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Publish Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              <SelectItem value="YES">Published</SelectItem>
              <SelectItem value="NO">Unpublished</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-3">
          <Select
            value={filters.foodType}
            onValueChange={(value) => updateFilter("foodType", value)}
            disabled={props.isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Product Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="FOOD">Food</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-2">
          <Select
            value={filters.flagged}
            onValueChange={(value) => updateFilter("flagged", value)}
            disabled={props.isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Moderation Flags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Flag States</SelectItem>
              <SelectItem value="YES">Flagged</SelectItem>
              <SelectItem value="NO">No Flags</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Filters update immediately. Search can be submitted with Enter or the
          button.
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={props.isPending || !hasActiveFilters}
          className="shrink-0"
        >
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      </div>
    </div>
  );
}
