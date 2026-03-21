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

export function ModeratorUsersFilters() {
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
        ? `/marketplace/dashboard/moderator/users?${next}`
        : "/marketplace/dashboard/moderator/users",
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
      router.push("/marketplace/dashboard/moderator/users");
    });
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    searchParams.get("role") !== null ||
    searchParams.get("state") !== null ||
    searchParams.get("blocked") !== null;

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
        <div className="sm:col-span-2 xl:col-span-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search user, email, username..."
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
            value={searchParams.get("role") ?? "ALL"}
            onValueChange={(value) => setParam("role", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="SELLER">Seller</SelectItem>
              <SelectItem value="RIDER">Rider</SelectItem>
              <SelectItem value="MODERATOR">Moderator</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-3">
          <Select
            value={searchParams.get("state") ?? "ALL"}
            onValueChange={(value) => setParam("state", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Moderation State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All States</SelectItem>
              <SelectItem value="CLEAR">Clear</SelectItem>
              <SelectItem value="WARNED">Warned</SelectItem>
              <SelectItem value="RESTRICTED">Restricted</SelectItem>
              <SelectItem value="SOFT_BLOCKED">Soft Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-2">
          <Select
            value={searchParams.get("blocked") ?? "ALL"}
            onValueChange={(value) => setParam("blocked", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Block Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Users</SelectItem>
              <SelectItem value="YES">Blocked</SelectItem>
              <SelectItem value="NO">Not Blocked</SelectItem>
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
