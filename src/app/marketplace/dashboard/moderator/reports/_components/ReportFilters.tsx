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

type ReportFilterState = {
  query: string;
  status: string;
  targetType: string;
  reason: string;
};

function readFilterState(
  searchParams: ReturnType<typeof useSearchParams>,
): ReportFilterState {
  return {
    query: searchParams.get("q") ?? "",
    status: searchParams.get("status") ?? "ALL",
    targetType: searchParams.get("targetType") ?? "ALL",
    reason: searchParams.get("reason") ?? "ALL",
  };
}

export function ReportFilters(props: {
  isPending: boolean;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ReportFilterState>(() =>
    readFilterState(searchParams),
  );

  useEffect(() => {
    setFilters(readFilterState(searchParams));
  }, [searchParams]);

  const navigate = (nextState: ReportFilterState) => {
    const nextParams = new URLSearchParams();

    if (nextState.query.trim()) {
      nextParams.set("q", nextState.query.trim());
    }

    if (nextState.status !== "ALL") {
      nextParams.set("status", nextState.status);
    }

    if (nextState.targetType !== "ALL") {
      nextParams.set("targetType", nextState.targetType);
    }

    if (nextState.reason !== "ALL") {
      nextParams.set("reason", nextState.reason);
    }

    const next = nextParams.toString();
    props.onNavigate(next ? `${pathname}?${next}` : pathname);
  };

  const updateFilter = <K extends keyof ReportFilterState>(
    key: K,
    value: ReportFilterState[K],
  ) => {
    const nextState = { ...filters, [key]: value };
    setFilters(nextState);
    navigate(nextState);
  };

  const applySearch = () => {
    navigate(filters);
  };

  const clearFilters = () => {
    const nextState: ReportFilterState = {
      query: "",
      status: "ALL",
      targetType: "ALL",
      reason: "ALL",
    };
    setFilters(nextState);
    props.onNavigate(pathname);
  };

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.status !== "ALL" ||
    filters.targetType !== "ALL" ||
    filters.reason !== "ALL";

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
        <div className="sm:col-span-2 xl:col-span-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search report, user, target..."
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
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-3">
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
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="PRODUCT">Product</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="MESSAGE">Message</SelectItem>
              <SelectItem value="STORE">Store</SelectItem>
              <SelectItem value="ORDER">Order</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-3">
          <Select
            value={filters.reason}
            onValueChange={(value) => updateFilter("reason", value)}
            disabled={props.isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Reasons</SelectItem>
              <SelectItem value="SPAM">Spam</SelectItem>
              <SelectItem value="SCAM">Scam</SelectItem>
              <SelectItem value="ABUSIVE_BEHAVIOR">Abusive Behavior</SelectItem>
              <SelectItem value="HARASSMENT">Harassment</SelectItem>
              <SelectItem value="FAKE_PRODUCT">Fake Product</SelectItem>
              <SelectItem value="PROHIBITED_ITEM">Prohibited Item</SelectItem>
              <SelectItem value="MISLEADING_INFORMATION">
                Misleading Information
              </SelectItem>
              <SelectItem value="OFF_PLATFORM_PAYMENT">
                Off-platform Payment
              </SelectItem>
              <SelectItem value="INAPPROPRIATE_CONTENT">
                Inappropriate Content
              </SelectItem>
              <SelectItem value="FRAUD">Fraud</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
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
