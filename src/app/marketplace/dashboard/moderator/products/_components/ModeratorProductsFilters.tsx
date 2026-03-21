"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ModeratorProductsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const pushQuery = (nextParams: URLSearchParams) => {
    const next = nextParams.toString();
    router.push(
      next
        ? `/marketplace/dashboard/moderator/products?${next}`
        : "/marketplace/dashboard/moderator/products",
    );
  };

  const setParam = (key: string, value: string) => {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("page");

      if (!value || value === "ALL") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }

      pushQuery(nextParams);
    });
  };

  const applySearch = () => {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const next = query.trim();
      nextParams.delete("page");

      if (!next) {
        nextParams.delete("q");
      } else {
        nextParams.set("q", next);
      }

      pushQuery(nextParams);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setQuery("");
      router.push("/marketplace/dashboard/moderator/products");
    });
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    searchParams.get("published") !== null ||
    searchParams.get("foodType") !== null ||
    searchParams.get("flagged") !== null;

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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applySearch();
                  }
                }}
                disabled={isPending}
              />
            </div>

            <Button
              type="button"
              onClick={applySearch}
              disabled={isPending}
              className="shrink-0"
            >
              Search
            </Button>
          </div>
        </div>

        <div className="xl:col-span-3">
          <Select
            value={searchParams.get("published") ?? "ALL"}
            onValueChange={(value) => setParam("published", value)}
            disabled={isPending}
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
            value={searchParams.get("foodType") ?? "ALL"}
            onValueChange={(value) => setParam("foodType", value)}
            disabled={isPending}
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
            value={searchParams.get("flagged") ?? "ALL"}
            onValueChange={(value) => setParam("flagged", value)}
            disabled={isPending}
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
          disabled={isPending || !hasActiveFilters}
          className="shrink-0"
        >
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      </div>
    </div>
  );
}
