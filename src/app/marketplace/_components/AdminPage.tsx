"use client";

import { Users, Package, DollarSign, AlertTriangle } from "lucide-react";

type AdminStats = {
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  pendingReports: number;
};

const AdminPage = ({ stats }: { stats: AdminStats }) => {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    {
      title: "Pending Payouts",
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
  ];

  return (
    <div className="px-6 py-8 dark:bg-gray-900 rounded-lg">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor platform performance and system health
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`p-6 rounded-2xl shadow-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between ${stat.color}`}
            >
              <div>
                <h3 className="text-sm font-medium">{stat.title}</h3>
                <p className="text-xl font-bold mt-1">{stat.value}</p>
              </div>
              <Icon className="h-8 w-8 opacity-80" />
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default AdminPage;
