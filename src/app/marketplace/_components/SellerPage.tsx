"use client";

import {
  Package,
  ShoppingBag,
  DollarSign,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";

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
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
    },
    {
      title: "Total Revenue",
      value: formatMoneyFromUSD(stats.totalRevenue),
      icon: DollarSign,
    },
    {
      title: "Performance",
      value: "View Report",
      icon: BarChart3,
    },
  ];

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-gray-500">
          Welcome back — monitor sales and manage your store
        </p>
      </div>

      {!stats.isStoreVerified && (
        <div className="p-4 bg-yellow-50 border rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-700" />
          <p className="text-sm text-yellow-800">
            Your store is not verified. Some features may be limited.
          </p>
        </div>
      )}

      {stats.lowStockCount > 0 && (
        <div className="p-4 bg-orange-50 border rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-700" />
          <p className="text-sm text-orange-800">
            {stats.lowStockCount} product variants are low on stock.
          </p>
        </div>
      )}

      {stats.pendingPayouts > 0 && (
        <div className="p-4 bg-blue-50 border rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-700" />
          <p className="text-sm text-blue-800">
            You have {stats.pendingPayouts} pending payouts awaiting processing.
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="p-5 bg-white dark:bg-neutral-950 border rounded-xl shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm dark:bg-neutral-950">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Latest Events</h2>
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
      </section>
    </main>
  );
}
