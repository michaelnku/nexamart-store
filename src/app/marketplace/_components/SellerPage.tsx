"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  DollarSign,
  Package,
  ShoppingBag,
  Star,
} from "lucide-react";

import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import {
  DashboardHero,
  PremiumNotice,
  PremiumPanel,
  PremiumStatCard,
} from "./PremiumDashboard";

type SellerStats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
  pendingPayouts: number;
  isStoreVerified: boolean;
  isStoreSuspended?: boolean;
  storeReviewSummary: {
    storeName: string | null;
    storeSlug: string | null;
    averageRating: number;
    reviewCount: number;
    ratingBreakdown: {
      rating: number;
      count: number;
      percentage: number;
    }[];
    recentReviews: {
      id: string;
      rating: number;
      title: string | null;
      comment: string | null;
      createdAt: string;
      customerName: string;
    }[];
  };
  latestEvents: {
    id: string;
    type: "ORDER" | "REVIEW" | "PAYOUT";
    title: string;
    description: string;
    status: string;
    amount: number | null;
    createdAt: string;
  }[];
};

export default function SellerPage({ stats }: { stats: SellerStats }) {
  const formatMoneyFromUSD = useFormatMoneyFromUSD();
  const formatStatus = (value: string) =>
    value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date(value));
  const storeReviewSummary = stats.storeReviewSummary;

  const dashboardStats = [
    {
      title: "Active Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Live listings currently available to shoppers.",
      tintClassName:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      description: "Orders processed across your storefront.",
      tintClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      title: "Total Revenue",
      value: formatMoneyFromUSD(stats.totalRevenue),
      icon: DollarSign,
      description: "Gross earnings captured from fulfilled sales.",
      tintClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      title: "Performance",
      value: "Open Reports",
      icon: BarChart3,
      description: "Review sales trends, conversion, and store performance.",
      tintClassName:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
      href: "/marketplace/dashboard/seller/reports",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <DashboardHero
        eyebrow="Seller Dashboard"
        title="Overview"
        description="Track demand, monitor revenue, and move from daily operations into higher-signal store decisions."
        accentClassName="bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#059669_100%)]"
      />

      {!stats.isStoreVerified && (
        <PremiumNotice
          icon={AlertTriangle}
          title="Verification Pending"
          description="Your store is not verified yet, so some marketplace capabilities remain limited."
          toneClassName="border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-100"
        />
      )}

      {stats.lowStockCount > 0 && (
        <PremiumNotice
          icon={AlertTriangle}
          title="Inventory Attention Needed"
          description={`${stats.lowStockCount} product variants are running low on stock and may affect order flow soon.`}
          toneClassName="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-100"
        />
      )}

      {stats.pendingPayouts > 0 && (
        <PremiumNotice
          icon={AlertTriangle}
          title="Pending Payouts"
          description={`You have ${stats.pendingPayouts} pending payout${stats.pendingPayouts === 1 ? "" : "s"} awaiting processing.`}
          toneClassName="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
        />
      )}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <PremiumStatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            tintClassName={stat.tintClassName}
            href={stat.href}
          />
        ))}
      </section>

      <PremiumPanel
        title="Store Reviews"
        description="Track your store reputation with verified feedback from completed purchases."
      >
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-zinc-300">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                Average rating
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {storeReviewSummary.averageRating.toFixed(1)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                From {storeReviewSummary.reviewCount} verified review
                {storeReviewSummary.reviewCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                Review volume
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {storeReviewSummary.reviewCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Completed-purchase store reviews
              </p>
            </div>

            <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950 sm:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Rating breakdown
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Distribution across all verified store reviews
                  </p>
                </div>
                {storeReviewSummary.storeSlug ? (
                  <Link
                    href={`/store/${storeReviewSummary.storeSlug}`}
                    className="text-sm font-medium text-sky-700 transition hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    View storefront
                  </Link>
                ) : null}
              </div>
              <div className="space-y-3">
                {storeReviewSummary.ratingBreakdown.map((row) => (
                  <div
                    key={row.rating}
                    className="grid grid-cols-[44px_minmax(0,1fr)_32px] items-center gap-3"
                  >
                    <div className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-zinc-300">
                      <span>{row.rating}</span>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9_0%,#06b6d4_45%,#14b8a6_100%)]"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="text-right text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                  Recent store reviews
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Latest public feedback shoppers see on your storefront.
                </p>
              </div>
            </div>

            {!storeReviewSummary.recentReviews.length ? (
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                No store reviews yet.
              </p>
            ) : (
              <div className="space-y-4">
                {storeReviewSummary.recentReviews.map((review, index) => (
                  <div
                    key={review.id}
                    className={`space-y-2 pb-4 ${
                      index !== storeReviewSummary.recentReviews.length - 1
                        ? "border-b border-slate-200/80 dark:border-zinc-800"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          {review.customerName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          {formatDateTime(review.createdAt)} UTC
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    {review.title ? (
                      <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                        {review.title}
                      </p>
                    ) : null}
                    <p className="text-sm leading-6 text-slate-600 dark:text-zinc-400">
                      {review.comment || "Customer left a rating without written feedback."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PremiumPanel>

      <PremiumPanel
        title="Latest Events"
        description="A concise feed of orders, reviews, and payout activity affecting your store."
      >
        <div className="mb-4 flex items-center justify-end">
          <Link
            href="/marketplace/dashboard/seller/reports"
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Open reports
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!stats.latestEvents.length ? (
          <p className="text-sm text-gray-500">No recent events yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.latestEvents.map((event, index) => (
              <div
                key={event.id}
                className={`flex flex-col gap-2 rounded-lg py-2 sm:flex-row sm:items-center sm:justify-between ${
                  index !== stats.latestEvents.length - 1
                    ? "border-b border-zinc-200 dark:border-zinc-800"
                    : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400">
                    {event.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(event.createdAt)} UTC
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {event.type}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {formatStatus(event.status)}
                  </span>
                  {typeof event.amount === "number" && (
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {formatMoneyFromUSD(event.amount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumPanel>
    </main>
  );
}
