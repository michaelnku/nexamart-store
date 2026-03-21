"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AiReviewQueueFilters() {
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
        ? `/marketplace/dashboard/moderator/ai?${next}`
        : "/marketplace/dashboard/moderator/ai",
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
      router.push("/marketplace/dashboard/moderator/ai");
    });
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    searchParams.get("status") !== null ||
    searchParams.get("reviewStatus") !== null ||
    searchParams.get("severity") !== null ||
    searchParams.get("targetType") !== null;

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
        <div className="sm:col-span-2 xl:col-span-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search incident, user, policy..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
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

        <div className="xl:col-span-2">
          <Select
            value={searchParams.get("reviewStatus") ?? "PENDING_HUMAN_REVIEW"}
            onValueChange={(value) => setParam("reviewStatus", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Review Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING_HUMAN_REVIEW">
                Pending Human Review
              </SelectItem>
              <SelectItem value="ALL">All Review Statuses</SelectItem>
              <SelectItem value="NOT_REQUIRED">Not Required</SelectItem>
              <SelectItem value="HUMAN_CONFIRMED">Human Confirmed</SelectItem>
              <SelectItem value="HUMAN_OVERTURNED">Human Overturned</SelectItem>
            </SelectContent>
          </Select>
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
            value={searchParams.get("targetType") ?? "ALL"}
            onValueChange={(value) => setParam("targetType", value)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Target Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Targets</SelectItem>
              <SelectItem value="PRODUCT">Product</SelectItem>
              <SelectItem value="PRODUCT_IMAGE">Product Image</SelectItem>
              <SelectItem value="MESSAGE">Message</SelectItem>
              <SelectItem value="CONVERSATION">Conversation</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="STORE">Store</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="DISPUTE">Dispute</SelectItem>
              <SelectItem value="VERIFICATION">Verification</SelectItem>
              <SelectItem value="ORDER">Order</SelectItem>
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
