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

export function IncidentFilters() {
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
        ? `/marketplace/dashboard/moderator/incidents?${next}`
        : "/marketplace/dashboard/moderator/incidents",
    );
  };

  const setParam = (key: string, value: string) => {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

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
      router.push("/marketplace/dashboard/moderator/incidents");
    });
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    searchParams.get("status") !== null ||
    searchParams.get("reviewStatus") !== null ||
    searchParams.get("severity") !== null ||
    searchParams.get("source") !== null;

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
        <div className="sm:col-span-2 xl:col-span-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search incident, reason, user, policy..."
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
              variant="default"
              onClick={applySearch}
              disabled={isPending}
              className="shrink-0"
            >
              Search
            </Button>
          </div>
        </div>

        <div className="xl:col-span-2">
          <Select
            value={searchParams.get("status") ?? "ALL"}
            onValueChange={(value) => setParam("status", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="OVERTURNED">Overturned</SelectItem>
              <SelectItem value="IGNORED">Ignored</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-2">
          <Select
            value={searchParams.get("reviewStatus") ?? "ALL"}
            onValueChange={(value) => setParam("reviewStatus", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Review Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Reviews</SelectItem>
              <SelectItem value="NOT_REQUIRED">Not Required</SelectItem>
              <SelectItem value="PENDING_HUMAN_REVIEW">
                Pending Human Review
              </SelectItem>
              <SelectItem value="HUMAN_CONFIRMED">Human Confirmed</SelectItem>
              <SelectItem value="HUMAN_OVERTURNED">Human Overturned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-2">
          <Select
            value={searchParams.get("severity") ?? "ALL"}
            onValueChange={(value) => setParam("severity", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-2">
          <Select
            value={searchParams.get("source") ?? "ALL"}
            onValueChange={(value) => setParam("source", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sources</SelectItem>
              <SelectItem value="AI">AI</SelectItem>
              <SelectItem value="HUMAN">Human</SelectItem>
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
