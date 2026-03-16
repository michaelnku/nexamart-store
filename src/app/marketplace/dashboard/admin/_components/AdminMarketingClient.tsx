"use client";

import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  LayoutTemplate,
  Megaphone,
  MoreHorizontal,
  MousePointerClick,
  Percent,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
  Tag,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  DashboardHero,
  PremiumPanel,
  PremiumStatCard,
} from "@/app/marketplace/_components/PremiumDashboard";
import {
  AnalyticsChangeFooter,
  AnalyticsRankedList,
  AnalyticsTrendPanel,
} from "@/app/marketplace/dashboard/admin/_components/AdminAnalyticsPanels";
import {
  moveHeroBannerPositionAction,
  toggleHeroBannerActiveAction,
} from "@/actions/banners";
import {
  softDeleteCouponAction,
  toggleCouponActiveAction,
} from "@/actions/coupons/createCouponAction";
import { AnalyticsDateRangeFilter } from "@/components/analytics/AnalyticsDateRangeFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { useAdminMarketingDashboard } from "@/hooks/useAdminMarketingDashboard";
import {
  AnalyticsDatePreset,
  applyAnalyticsPreset,
} from "@/lib/analytics/date-range";
import {
  formatAnalyticsCount,
  formatAnalyticsPercent,
} from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

type AdminMarketingClientProps = {
  initialRange: {
    preset: AnalyticsDatePreset;
    startDate: string;
    endDate: string;
  };
};

function LoadingState() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-[28px]" />
      <Skeleton className="h-24 rounded-[24px]" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[24px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[360px] rounded-[28px]" />
        ))}
      </div>
      <Skeleton className="h-[520px] rounded-[28px]" />
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCouponValue(type: string, value: number) {
  if (type === "PERCENTAGE") {
    return `${formatAnalyticsCount(value)}%`;
  }

  if (type === "FREE_SHIPPING") {
    return "Free shipping";
  }

  return `$${formatAnalyticsCount(value)}`;
}

function BannerStatusBadge({
  status,
}: {
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED";
}) {
  const toneClassName =
    status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
      : status === "SCHEDULED"
        ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300"
        : status === "EXPIRED"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          : "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";

  return (
    <Badge variant="outline" className={toneClassName}>
      {status.toLowerCase().replace("_", " ")}
    </Badge>
  );
}

export default function AdminMarketingClient({
  initialRange,
}: AdminMarketingClientProps) {
  const [range, setRange] = useState(initialRange);
  const [storeSearch, setStoreSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isPending, startTransition] = useTransition();
  const formatMoney = useFormatMoneyFromUSD();
  const queryClient = useQueryClient();
  const query = useAdminMarketingDashboard(range);
  const dashboard = query.data ?? null;

  const filteredStores = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.featuredContent.stores.filter((store) =>
      store.label.toLowerCase().includes(storeSearch.toLowerCase()),
    );
  }, [dashboard, storeSearch]);

  const filteredProducts = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return dashboard.featuredContent.products.filter((product) =>
      product.label.toLowerCase().includes(productSearch.toLowerCase()),
    );
  }, [dashboard, productSearch]);

  const invalidateDashboard = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["admin-marketing-dashboard"],
    });
  };

  const handleBannerToggle = (id: string, nextIsActive: boolean) => {
    startTransition(async () => {
      const result = await toggleHeroBannerActiveAction(id, nextIsActive);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(nextIsActive ? "Banner activated." : "Banner disabled.");
      await invalidateDashboard();
    });
  };

  const handleMoveBanner = (id: string, direction: "up" | "down") => {
    startTransition(async () => {
      const result = await moveHeroBannerPositionAction(id, direction);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        direction === "up"
          ? "Banner priority increased."
          : "Banner priority decreased.",
      );
      await invalidateDashboard();
    });
  };

  const handleCouponToggle = (id: string, nextIsActive: boolean) => {
    startTransition(async () => {
      const result = await toggleCouponActiveAction(id, nextIsActive);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(nextIsActive ? "Coupon activated." : "Coupon disabled.");
      await invalidateDashboard();
    });
  };

  const handleCouponDelete = (id: string) => {
    startTransition(async () => {
      const result = await softDeleteCouponAction(id);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Coupon archived.");
      await invalidateDashboard();
    });
  };

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.isError || !dashboard) {
    const errorMessage =
      query.error instanceof Error
        ? query.error.message
        : "Failed to load the marketing dashboard.";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Marketplace Marketing Control"
          title="Marketing"
          description="Manage banners, coupon-driven demand, and merchandising readiness from a premium marketplace marketing control center."
          accentClassName="bg-[linear-gradient(135deg,#1f2937_0%,#23416d_48%,#0f766e_100%)]"
        />
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {errorMessage}
        </div>
      </div>
    );
  }

  const overviewCards = [
    {
      title: "Active Banners",
      value: formatAnalyticsCount(dashboard.snapshot.activeBanners),
      description: "Banner placements active as of the selected period end.",
      icon: LayoutTemplate,
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
      change: dashboard.changes.activeBanners,
    },
    {
      title: "Active Coupons",
      value: formatAnalyticsCount(dashboard.snapshot.activeCoupons),
      description: "Enabled coupons valid through the selected range end date.",
      icon: TicketPercent,
      tintClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
      change: dashboard.changes.activeCoupons,
    },
    {
      title: "Campaign Conversions",
      value: formatAnalyticsPercent(dashboard.rangeSummary.campaignConversions),
      description: "Share of paid orders in range that used a coupon.",
      icon: Percent,
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      change: dashboard.changes.campaignConversions,
    },
    {
      title: "Revenue From Coupons",
      value: formatMoney(dashboard.rangeSummary.revenueFromCoupons),
      description:
        "Paid order GMV attributed to coupon-backed orders in range.",
      icon: Megaphone,
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
      change: dashboard.changes.revenueFromCoupons,
    },
    {
      title: "Orders Using Coupons",
      value: formatAnalyticsCount(dashboard.rangeSummary.ordersUsingCoupons),
      description: "Paid orders created in range with a coupon attached.",
      icon: ShoppingBag,
      tintClassName:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
      change: dashboard.changes.ordersUsingCoupons,
    },
    {
      title: "Banner Click Through Rate",
      value: "Untracked",
      description: "Percentage of banner impressions that resulted in a click.",
      icon: MousePointerClick,
      tintClassName:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
    },
  ];

  const bannerCounts = dashboard.banners.reduce(
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

  const bannersByPlacement = dashboard.banners.reduce<
    Array<{
      placement: string;
      placementLabel: string;
      banners: typeof dashboard.banners;
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

  const ordersUsingCouponsChartData = dashboard.trends.ordersUsingCoupons.map(
    (point) => ({
      label: point.label,
      orders: point.value,
    }),
  );

  const selectedStoreLabel =
    filteredStores.find((store) => store.id === selectedStoreId)?.label ?? "";
  const selectedProductLabel =
    filteredProducts.find((product) => product.id === selectedProductId)
      ?.label ?? "";

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Marketplace Marketing Control"
        title="Marketing"
        description="Manage banners, coupon-driven demand, and merchandising readiness from a premium marketplace marketing control center."
        accentClassName="bg-[linear-gradient(135deg,#1f2937_0%,#23416d_48%,#0f766e_100%)]"
      />

      <AnalyticsDateRangeFilter
        preset={range.preset}
        startDate={range.startDate}
        endDate={range.endDate}
        disabled={query.isFetching || isPending}
        onPresetChange={(preset) =>
          setRange((currentRange) => applyAnalyticsPreset(currentRange, preset))
        }
        onCustomRangeApply={({ startDate, endDate }) =>
          setRange({
            preset: "custom",
            startDate,
            endDate,
          })
        }
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Marketing Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review marketing configuration and coupon-attributed demand in the
            selected reporting context.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {overviewCards.map((item) => (
            <PremiumStatCard
              key={item.title}
              title={item.title}
              value={item.value}
              description={item.description}
              icon={item.icon}
              tintClassName={item.tintClassName}
              footer={
                "change" in item ? (
                  <AnalyticsChangeFooter value={item.change ?? null} />
                ) : undefined
              }
            />
          ))}
        </div>
      </section>

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

        {dashboard.banners.length === 0 ? (
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutTemplate />
              </EmptyMedia>
              <EmptyTitle>No banner campaigns configured</EmptyTitle>
              <EmptyDescription>
                Create your first hero banner campaign to start managing
                homepage and category placements here.
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
                              Start {formatDate(banner.startDate)} - End{" "}
                              {formatDate(banner.endDate)}
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
                                  handleBannerToggle(
                                    banner.id,
                                    !banner.isActive,
                                  )
                                }
                              >
                                {banner.isActive
                                  ? "Disable banner"
                                  : "Enable banner"}
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
                            onClick={() => handleMoveBanner(banner.id, "up")}
                          >
                            <ArrowUp className="h-4 w-4" />
                            Higher
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              isPending || index === group.banners.length - 1
                            }
                            onClick={() => handleMoveBanner(banner.id, "down")}
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

      <PremiumPanel
        title="Coupons & Promotions"
        description="Manage coupon inventory, validity windows, and activation states to drive sales and conversions."
      >
        <div className="mb-5 flex flex-wrap flex-col items-center justify-between gap-3">
          <Button asChild>
            <Link href="/marketplace/dashboard/admin/coupons/create">
              <Plus className="h-4 w-4" />
              Create Coupon
            </Link>
          </Button>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Coupons are a great way to drive sales and conversions.
          </p>
        </div>

        {dashboard.coupons.length === 0 ? (
          <Empty className="border-slate-200/80 dark:border-zinc-800">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TicketPercent />
              </EmptyMedia>
              <EmptyTitle>No coupons available</EmptyTitle>
              <EmptyDescription>
                Create a coupon to start driving promotions and conversion
                reporting.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {[
                    "Code",
                    "Type",
                    "Value",
                    "Usage",
                    "Usage Limit",
                    "Min Order",
                    "Active",
                    "Valid From",
                    "Valid To",
                    "Actions",
                  ].map((column) => (
                    <th
                      key={column}
                      className="border-b border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-zinc-800 dark:text-zinc-400"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="border-b border-slate-200/60 px-4 py-4 font-medium text-slate-950 dark:border-zinc-900 dark:text-white">
                      {coupon.code}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {coupon.type.toLowerCase().replace("_", " ")}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {formatCouponValue(coupon.type, coupon.value)}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {formatAnalyticsCount(coupon.usageCount)}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {coupon.usageLimit
                        ? formatAnalyticsCount(coupon.usageLimit)
                        : "Unlimited"}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {coupon.minOrderAmount
                        ? formatMoney(coupon.minOrderAmount)
                        : "None"}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          coupon.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                        )}
                      >
                        {coupon.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {formatDate(coupon.validFrom)}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4 text-sm text-slate-600 dark:border-zinc-900 dark:text-zinc-300">
                      {formatDate(coupon.validTo)}
                    </td>
                    <td className="border-b border-slate-200/60 px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/marketplace/dashboard/admin/coupons/${coupon.id}`}
                            >
                              Edit coupon
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleCouponToggle(coupon.id, !coupon.isActive)
                            }
                          >
                            {coupon.isActive
                              ? "Disable coupon"
                              : "Enable coupon"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-700 dark:text-rose-300 dark:focus:text-rose-200"
                            onSelect={() => handleCouponDelete(coupon.id)}
                          >
                            Archive coupon
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PremiumPanel>

      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Campaign Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Focused reporting for currently tracked coupon activity.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AnalyticsTrendPanel
            title="Coupon Usage Over Time"
            description="Coupon redemption events grouped by usage date."
            data={dashboard.trends.couponUsage}
            dataKey="couponUsage"
            color="#7c3aed"
            formatter={(value) => formatAnalyticsCount(value)}
          />

          <PremiumPanel
            title="Banner Click Through Rate"
            description="Banner CTR remains unavailable until impression and click tracking are added to the current data model."
          >
            <Empty className="border-slate-200/80 dark:border-zinc-800">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MousePointerClick />
                </EmptyMedia>
                <EmptyTitle>Banner CTR tracking unavailable</EmptyTitle>
                <EmptyDescription>
                  Expand the range or wait for banner CTR data to be available.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </PremiumPanel>

          <PremiumPanel
            title="Orders Using Coupons"
            description="Number of orders using at least one coupon."
          >
            {ordersUsingCouponsChartData.length === 0 ? (
              <Empty className="border-slate-200/80 dark:border-zinc-800">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShoppingBag />
                  </EmptyMedia>
                  <EmptyTitle>No coupon-backed orders in this range</EmptyTitle>
                  <EmptyDescription>
                    Expand the range or wait for coupon-attributed orders to be
                    recorded.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ordersUsingCouponsChartData}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value: number | string | undefined) => [
                        formatAnalyticsCount(
                          typeof value === "number"
                            ? value
                            : Number(value ?? 0),
                        ),
                        "Orders",
                      ]}
                    />
                    <Bar
                      dataKey="orders"
                      radius={[8, 8, 0, 0]}
                      fill="#0f766e"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </PremiumPanel>

          <AnalyticsRankedList
            title="Top Performing Coupons"
            description="Coupons ranked by paid order GMV attributed in the selected range."
            rows={dashboard.topCoupons}
            primaryFormatter={formatMoney}
            secondaryLabel={(value) =>
              `${formatAnalyticsCount(value)} order${value === 1 ? "" : "s"}`
            }
          />
        </div>
      </section>

      <PremiumPanel
        title="Featured Content"
        description="Review candidate merchandising content while featured-content persistence remains unavailable."
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Featured stores
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={storeSearch}
                  onChange={(event) => setStoreSearch(event.target.value)}
                  placeholder="Search stores"
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedStoreId}
                onValueChange={setSelectedStoreId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a store candidate" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {selectedStoreLabel || "No store selected."}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled
                className="w-full"
              >
                Featured store persistence not configured
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Featured products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search product candidates"
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a product candidate" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {selectedProductLabel || "No product selected."}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled
                className="w-full"
              >
                Featured product persistence not configured
              </Button>
            </div>
          </div>

          <Card className="border-slate-200/80 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" />
                Seasonal Campaign Tags
              </CardTitle>
              <CardDescription>
                Select seasonal campaign tags to be applied to the homepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-zinc-300">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                Use existing coupon and banner controls for campaign execution
                today. A dedicated featured-content configuration model is still
                required before this section can persist changes safely.
              </div>
              <div className="flex flex-wrap gap-2">
                {["Black Friday", "Holiday", "Back To School"].map((label) => (
                  <Badge
                    key={label}
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t border-slate-200/80 dark:border-zinc-800">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Seasonal tag controls intentionally remain read-only.
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link href="/marketplace/dashboard/admin/marketing/banners">
                  Review banner placements
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PremiumPanel>

      {query.isFetching || isPending ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled>
            <RefreshCcw className="h-4 w-4" />
            Refreshing marketing controls...
          </Button>
        </div>
      ) : null}
    </main>
  );
}
