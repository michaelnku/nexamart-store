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

type IncidentFilterState = {
  query: string;
  status: string;
  reviewStatus: string;
  severity: string;
  targetType: string;
  source: string;
};

function readFilterState(
  searchParams: ReturnType<typeof useSearchParams>,
): IncidentFilterState {
  return {
    query: searchParams.get("q") ?? "",
    status: searchParams.get("status") ?? "ALL",
    reviewStatus: searchParams.get("reviewStatus") ?? "ALL",
    severity: searchParams.get("severity") ?? "ALL",
    targetType: searchParams.get("targetType") ?? "ALL",
    source: searchParams.get("source") ?? "ALL",
  };
}

export function IncidentFilters(props: {
  isPending: boolean;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<IncidentFilterState>(() =>
    readFilterState(searchParams),
  );

  useEffect(() => {
    setFilters(readFilterState(searchParams));
  }, [searchParams]);

  const navigate = (nextState: IncidentFilterState) => {
    const nextParams = new URLSearchParams();

    if (nextState.query.trim()) {
      nextParams.set("q", nextState.query.trim());
    }

    if (nextState.status !== "ALL") {
      nextParams.set("status", nextState.status);
    }

    if (nextState.reviewStatus !== "ALL") {
      nextParams.set("reviewStatus", nextState.reviewStatus);
    }

    if (nextState.severity !== "ALL") {
      nextParams.set("severity", nextState.severity);
    }

    if (nextState.targetType !== "ALL") {
      nextParams.set("targetType", nextState.targetType);
    }

    if (nextState.source !== "ALL") {
      nextParams.set("source", nextState.source);
    }

    const next = nextParams.toString();
    props.onNavigate(next ? `${pathname}?${next}` : pathname);
  };

  const updateFilter = <K extends keyof IncidentFilterState>(
    key: K,
    value: IncidentFilterState[K],
  ) => {
    const nextState = { ...filters, [key]: value };
    setFilters(nextState);
    navigate(nextState);
  };

  const applySearch = () => {
    navigate(filters);
  };

  const clearFilters = () => {
    const nextState: IncidentFilterState = {
      query: "",
      status: "ALL",
      reviewStatus: "ALL",
      severity: "ALL",
      targetType: "ALL",
      source: "ALL",
    };
    setFilters(nextState);
    props.onNavigate(pathname);
  };

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.status !== "ALL" ||
    filters.reviewStatus !== "ALL" ||
    filters.severity !== "ALL" ||
    filters.targetType !== "ALL" ||
    filters.source !== "ALL";

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
              variant="default"
              onClick={applySearch}
              disabled={props.isPending}
              className="shrink-0"
            >
              Search
            </Button>
          </div>
        </div>

        <div className="xl:col-span-2">
          <Select
            value={filters.status}
            onValueChange={(value) => updateFilter("status", value)}
            disabled={props.isPending}
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
            value={filters.reviewStatus}
            onValueChange={(value) => updateFilter("reviewStatus", value)}
            disabled={props.isPending}
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
            value={filters.severity}
            onValueChange={(value) => updateFilter("severity", value)}
            disabled={props.isPending}
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
            value={filters.targetType}
            onValueChange={(value) => updateFilter("targetType", value)}
            disabled={props.isPending}
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

        <div className="xl:col-span-2">
          <Select
            value={filters.source}
            onValueChange={(value) => updateFilter("source", value)}
            disabled={props.isPending}
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
