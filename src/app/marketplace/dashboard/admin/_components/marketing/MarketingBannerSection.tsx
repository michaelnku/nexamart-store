"use client";

import { ArrowDown, ArrowUp, LayoutTemplate, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { PremiumPanel } from "@/app/marketplace/_components/PremiumDashboard";
import type { AdminMarketingDashboardResponse } from "@/lib/services/admin/adminMarketingService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { formatAnalyticsCount } from "@/lib/analytics/format";
import { BannerStatusBadge, formatMarketingDate } from "./marketingShared";

export function MarketingBannerSection({
  banners,
  isPending,
  onToggleBanner,
  onMoveBanner,
}: {
  banners: AdminMarketingDashboardResponse["banners"];
  isPending: boolean;
  onToggleBanner: (id: string, nextIsActive: boolean) => void;
  onMoveBanner: (id: string, direction: "up" | "down") => void;
}) {
  const bannerCounts = banners.reduce(
    (accumulator, banner) => {
      accumulator[banner.status] += 1;
      return accumulator;
    },
    {
      ACTIVE: 0,
      SCHEDULED: 0,
      EXPIRED: 0,
      DISABLED: 0,
    },
  );

  const bannersByPlacement = banners.reduce<
    Array<{
      placement: string;
      placementLabel: string;
      banners: typeof banners;
    }>
  >((groups, banner) => {
    const existingGroup = groups.find(
      (group) => group.placement === banner.placement,
    );

    if (existingGroup) {
      existingGroup.banners.push(banner);
      return groups;
    }

    groups.push({
      placement: banner.placement,
      placementLabel: banner.placementLabel,
      banners: [banner],
    });

    return groups;
  }, []);

  return (
    <PremiumPanel
      title="Banner Campaigns"
      description="Review the current hero banner slate, adjust placement priority, and disable placements without leaving the marketing control center."
    >
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          { label: "Active banners", value: bannerCounts.ACTIVE },
          { label: "Scheduled banners", value: bannerCounts.SCHEDULED },
          { label: "Expired banners", value: bannerCounts.EXPIRED },
          { label: "Disabled banners", value: bannerCounts.DISABLED },
        ].map((item) => (
          <Card
            key={item.label}
            className="gap-3 border-slate-200/80 py-4 dark:border-zinc-800"
          >
            <CardHeader className="px-4">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">
                {formatAnalyticsCount(item.value)}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {banners.length === 0 ? (
        <Empty className="border-slate-200/80 dark:border-zinc-800">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutTemplate />
            </EmptyMedia>
            <EmptyTitle>No banner campaigns configured</EmptyTitle>
            <EmptyDescription>
              Create your first hero banner campaign to start managing homepage
              and category placements here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-6">
          {bannersByPlacement.map((group) => (
            <div key={group.placement} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400">
                    {group.placementLabel}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    {formatAnalyticsCount(group.banners.length)} banner
                    {group.banners.length === 1 ? "" : "s"} in this placement.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {group.banners.map((banner, index) => (
                  <Card
                    key={banner.id}
                    className="gap-0 border-slate-200/80 py-0 dark:border-zinc-800"
                  >
                    <CardHeader className="border-b border-slate-200/80 px-5 py-5 dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base">
                              {banner.title}
                            </CardTitle>
                            <BannerStatusBadge status={banner.status} />
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                            >
                              {banner.placementLabel}
                            </Badge>
                          </div>
                          <CardDescription>
                            Priority {formatAnalyticsCount(banner.priority)} -
                            Start {formatMarketingDate(banner.startDate)} - End{" "}
                            {formatMarketingDate(banner.endDate)}
                          </CardDescription>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/marketplace/dashboard/admin/marketing/banners/${banner.id}`}
                              >
                                Edit banner
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                onToggleBanner(banner.id, !banner.isActive)
                              }
                            >
                              {banner.isActive ? "Disable banner" : "Enable banner"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/marketplace/dashboard/admin/marketing/banners">
                                Open banner settings
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-zinc-400">
                        <span>Sortable priority controls</span>
                        <span>
                          Position {formatAnalyticsCount(index + 1)} of{" "}
                          {formatAnalyticsCount(group.banners.length)} in{" "}
                          {group.placementLabel}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="justify-between border-t border-slate-200/80 px-5 py-4 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending || index === 0}
                          onClick={() => onMoveBanner(banner.id, "up")}
                        >
                          <ArrowUp className="h-4 w-4" />
                          Higher
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending || index === group.banners.length - 1}
                          onClick={() => onMoveBanner(banner.id, "down")}
                        >
                          <ArrowDown className="h-4 w-4" />
                          Lower
                        </Button>
                      </div>

                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/marketplace/dashboard/admin/marketing/banners/${banner.id}`}
                        >
                          Edit
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PremiumPanel>
  );
}
