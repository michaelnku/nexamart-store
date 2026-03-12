"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  DollarSign,
  Package,
  ShoppingBag,
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
