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

type UserFilterState = {
  query: string;
  role: string;
  state: string;
  blocked: string;
};

function readFilterState(
  searchParams: ReturnType<typeof useSearchParams>,
): UserFilterState {
  return {
    query: searchParams.get("q") ?? "",
    role: searchParams.get("role") ?? "ALL",
    state: searchParams.get("state") ?? "ALL",
    blocked: searchParams.get("blocked") ?? "ALL",
  };
}

export function ModeratorUsersFilters(props: {
  isPending: boolean;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<UserFilterState>(() =>
    readFilterState(searchParams),
  );

  useEffect(() => {
    setFilters(readFilterState(searchParams));
  }, [searchParams]);

  const navigate = (nextState: UserFilterState) => {
    const nextParams = new URLSearchParams();

    if (nextState.query.trim()) {
      nextParams.set("q", nextState.query.trim());
    }

    if (nextState.role !== "ALL") {
      nextParams.set("role", nextState.role);
    }

    if (nextState.state !== "ALL") {
      nextParams.set("state", nextState.state);
    }

    if (nextState.blocked !== "ALL") {
      nextParams.set("blocked", nextState.blocked);
    }

    const next = nextParams.toString();
    props.onNavigate(next ? `${pathname}?${next}` : pathname);
  };

  const updateFilter = <K extends keyof UserFilterState>(
    key: K,
    value: UserFilterState[K],
  ) => {
    const nextState = { ...filters, [key]: value };
    setFilters(nextState);
    navigate(nextState);
  };

  const applySearch = () => {
    navigate(filters);
  };

  const clearFilters = () => {
    const nextState: UserFilterState = {
      query: "",
      role: "ALL",
      state: "ALL",
      blocked: "ALL",
    };
    setFilters(nextState);
    props.onNavigate(pathname);
  };

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.role !== "ALL" ||
    filters.state !== "ALL" ||
    filters.blocked !== "ALL";

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
            value={filters.role}
            onValueChange={(value) => updateFilter("role", value)}
            disabled={props.isPending}
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
            value={filters.state}
            onValueChange={(value) => updateFilter("state", value)}
            disabled={props.isPending}
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
            value={filters.blocked}
            onValueChange={(value) => updateFilter("blocked", value)}
            disabled={props.isPending}
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
