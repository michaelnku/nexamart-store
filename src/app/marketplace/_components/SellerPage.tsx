"use client";

import {
  Package,
  ShoppingBag,
  DollarSign,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

type SellerStats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
  pendingPayouts: number;
  isStoreVerified: boolean;
  isStoreSuspended?: boolean;
};

export default function SellerPage({ stats }: { stats: SellerStats }) {
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
      value: `$${stats.totalRevenue.toFixed(2)}`,
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
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500">
          Welcome back — monitor sales and manage your store
        </p>
      </div>

      {/* 🔔 WARNINGS */}
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

      {/* STATS */}
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
    </main>
  );
}
