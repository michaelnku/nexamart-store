"use client";

import { LayoutTemplate, Megaphone, MousePointerClick, Percent, ShoppingBag, TicketPercent } from "lucide-react";

import { PremiumStatCard } from "@/app/marketplace/_components/PremiumDashboard";
import { AnalyticsChangeFooter } from "@/app/marketplace/dashboard/admin/_components/AdminAnalyticsPanels";
import type { AdminMarketingDashboardResponse } from "@/lib/services/admin/adminMarketingService";
import { formatAnalyticsCount, formatAnalyticsPercent } from "@/lib/analytics/format";

export function MarketingOverviewSection({
  dashboard,
  formatMoney,
}: {
  dashboard: AdminMarketingDashboardResponse;
  formatMoney: (value: number) => string;
}) {
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
      description: "Paid order GMV attributed to coupon-backed orders in range.",
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

  return (
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
  );
}
