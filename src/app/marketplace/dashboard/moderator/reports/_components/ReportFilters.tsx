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

export function ReportFilters() {
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
        ? `/marketplace/dashboard/moderator/reports?${next}`
        : "/marketplace/dashboard/moderator/reports",
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
      router.push("/marketplace/dashboard/moderator/reports");
    });
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    searchParams.get("status") !== null ||
    searchParams.get("reason") !== null ||
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
                placeholder="Search report, user, target..."
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
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="xl:col-span-3">
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
            value={searchParams.get("reason") ?? "ALL"}
            onValueChange={(value) => setParam("reason", value)}
            disabled={isPending}
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
